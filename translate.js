"use strict";

// scope: the scope in which this component exists
// this.scope: the scope for this component, in which its child components exist
// this.scope.argument == scope, the scope in which to instantiate the parameter component

var Q = require("q");
var domenic = require("domenic");
var parser = new domenic.DOMParser();
var innerText = require("./dom/inner-text");

module.exports = function translate(module, type) {
    var trim = 0;
    if (type === "application/xml") {
        trim = 4;
    } else if (type === "text/html") {
        trim = 5;
    } else {
        throw new Error("Can't translate type " + JSON.stringify(type) + " Use text/html or application/xml");
    }
    var displayName = module.display.slice(0, module.display.length - trim).split(/[#\/]/g).map(function (part) {
        part = part.replace(/[^\w\d]/g, "");
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }).join("");
    if (!/[A-Z]/.test(displayName[0])) {
        displayName = "_" + displayName;
    }
    var document = parser.parseFromString(module.text, type);
    var program = new Program();
    var template = new Template();
    program.add('"use strict";\n');
    module.dependencies = [];
    module.neededTags = {};
    analyzeDocument(document, program, template, module);
    return Q.all(Object.keys(module.neededTags).map(function (name) {
        var href = module.neededTags[name];
        return module.require.load(href)
        .then(function () {
            template.getTag(name).module = module.require.lookup(href);
        });
    })).then(function () {
        translateDocument(document, program, template, module, "THIS", displayName);
        module.text = program.digest();
        console.log(module.text);
    });
};

// TODO We need to use this data, but whether space can be trimmed has less to
// do with the parent element and more to do with siblings.
// <div>  a: <span>x</span>,  <span>y</span>  </div>
//      ^^                   ^              ^^
// Custom tags need to be able to express whether and how internal and
// surrounding space should be handled.
// CSS lies.

function analyzeDocument(document, program, template, module) {
    var child = document.documentElement.firstChild;
    while (child) {
        if (child.nodeType === 1 /* ELEMENT_NODE */) {
            if (child.tagName.toLowerCase() === "head") {
                analyzeHead(child, program, template, module);
            }
        }
        child = child.nextSibling;
    }
}

function analyzeHead(head, program, template, module) {
    template.addTag("THIS", {type: "this"});
    if (head) {
        var child = head.firstChild;
        while (child) {
            // TODO constants do not exist in minidom
            if (child.nodeType === 1 /* ELEMENT_NODE */) {
                if (child.tagName.toLowerCase() === "link") {
                    var rel = child.getAttribute("rel");
                    if (rel === "extends") {
                        var href = child.getAttribute("href");
                        program.add("var $SUPER = require" + "(" + JSON.stringify(href) + ");\n");
                        module.dependencies.push(href);
                        template.extends = true;
                        template.addTag("SUPER", {type: "super"});
                    } else if (rel === "exports") {
                        var href = child.getAttribute("href");
                        template.exports = href;
                        module.dependencies.push(href);
                    } else if (rel === "tag") {
                        var href = child.getAttribute("href");
                        var as = child.getAttribute("as");
                        if (!as) {
                            as = /([^\/]+)\.html$/.exec(href);
                            as = as[1];
                        }
                        as = as.toUpperCase();
                        // TODO validate identifier
                        program.add("var $" + as + " = require" + "(" + JSON.stringify(href) + ");\n");
                        module.neededTags[as] = href;
                        module.dependencies.push(href);
                        template.addTag(as, {type: "external", id: href});
                    }
                    // ...
                } else if (child.tagName.toLowerCase() === "meta") {
                    if (child.getAttribute("accepts")) {
                        var accepts = child.getAttribute("accepts");
                        var parameter = {};
                        module.parameter = parameter;
                        if (accepts === ".innerText") {
                            parameter.innerText = true;
                        } else if (accepts === ".innerHTML") {
                            parameter.innerHTML = true;
                        } else if (accepts === ".component") {
                            parameter.component = true;
                            // TODO accepts as different names
                            template.addTag("ARGUMENT", {type: "argument", module: {parameter: {}}});
                        } else if (accepts === ".component*") {
                            console.log("ACCEPTS COMPONENTS", module.id);
                            parameter.components = true;
                        } else {
                            // TODO fancy argument patterns
                        }
                    }
                    // ...
                }
            }
            child = child.nextSibling;
        }
    }
}

function translateDocument(document, program, template, module, name, displayName) {
    if (template.exports) {
        program.add("module.exports = (require)(" + JSON.stringify(template.exports) + ");\n");
    } else {
        var child = document.documentElement.firstChild;
        while (child) {
            if (child.nodeType === 1 /* ELEMENT_NODE */) {
                if (child.tagName.toLowerCase() === "body") {
                    translateBody(child, program, template, name, displayName);
                }
            }
            child = child.nextSibling;
        }
        program.add("module.exports = $THIS;\n");
    }
    return program.digest();
}

function translateBody(body, program, template, name, displayName) {
    program.add("var $" + name + " = function " + displayName + "(body, argumentScope, $ARGUMENT) {\n");
    program.indent();

    // Establish the component and its scope
    program.add("var document = body.ownerDocument;\n");
    program.add("var scope = this.scope = argumentScope.root.nest(this);\n");
    program.add("scope.argumentScope = argumentScope;\n");
    program.add("scope.this = this;\n");

    // Build out the body
    translateSegment(body, program, template, name, displayName);

    // Call super constructor
    if (template.extends) {
        program.add("$SUPER.apply(this, arguments);\n");
    }

    program.exdent();
    program.add("};\n");
    // Trailing inheritance declarations
    if (template.extends) {
        program.add("$THIS.prototype = Object.create($SUPER.prototype);\n");
        program.add("$THIS.prototype.constructor = $THIS;\n");
    }
}

function translateArgument(node, program, template, name, displayName) {
    program.add("var $" + name + " = function " + displayName + "(body, scope, $ARGUMENT) {\n");
    program.indent();
    program.add("this.scope = scope;\n");
    program.add("var document = body.ownerDocument;\n");
    translateSegment(node, program, template, name, displayName);
    program.exdent();
    program.add("};\n");
}

function translateSegment(node, program, template, name, displayName) {
    var header = program.add("var parent = body, parents = [], node, component, componentScope, argument;\n");
    var unused = true;
    var child = node.firstChild;
    while (child) {
        if (child.nodeType === 1 /* domenic.Element.ELEMENT_NODE*/) {
            unused = false;
            translateElement(child, program, template, name, displayName);
        } else if (child.nodeType === 3 /*domenic.Element.TEXT_NODE*/) {
            var text = child.nodeValue;
            text = text.replace(/[\s\n]+/g, " ");
            if (text) {
                unused = false;
                program.add("parent.appendChild(document.createTextNode(" + JSON.stringify(text) + "));\n");
            }
        }
        child = child.nextSibling;
    }
    if (unused) {
        program.retract(header);
    }
}

function translateElement(node, program, template, name, displayName) {
    var id = node.getAttribute("id");
    var tagName = node.tagName.toUpperCase();
    var argumentTag = template.getTag(tagName);

    if (argumentTag) {
        program.add("node = document.createBody();\n");
    } else {
        program.add("node = document.createElement(" + JSON.stringify(node.tagName) + ");\n");
    }

    program.add("parent.appendChild(node);\n");

    var component;
    if (argumentTag && argumentTag.module.parameter) {
        negotiateArgument(node, argumentTag, argumentTag.module.parameter, program, template, name, displayName);
    } else {
        component = program.add("component = node;\n");
    }

    // Introduce new component or node to its owner.
    if (id) {
        program.add("if (scope.this.addChild) {\n");
        program.indent();
        program.add("scope.this.addChild(component, " + JSON.stringify(id) + ", scope);\n");
        program.exdent();
        program.add("} else {\n");
        program.indent();
        program.add("scope.this[" + JSON.stringify(id) + "] = component;\n");
        program.exdent();
        program.add("}\n");
    } else if (component) {
        program.retract(component);
    }

    if (!argumentTag) {
        for (var attribute, key, value, index = 0, attributes = node.attributes, length = attributes.length; index < length; index++) {
            attribute = attributes.item(index);
            key = attribute.nodeName;
            value = attribute.value || node.nodeValue;
            if (key === "id") {
                continue;
            }
            program.add("node.setAttribute(" + JSON.stringify(key) + ", " + JSON.stringify(value) + ");\n");
        }
        translateFragment(node, program, template, name, displayName);
    }
}

function translateFragment(node, program, template, name, displayName) {
    var child = node.firstChild;
    var text;
    while (child) {
        // invariant: node is the parent node
        if (child.nodeType === 1 /*domenic.Element.ELEMENT_NODE*/) {
            program.push();
            translateElement(child, program, template, name, displayName);
            program.pop();
        } else if (child.nodeType === 3 /*domenic.Element.TEXT_NODE*/) {
            text = child.nodeValue;
            text = text.replace(/[\s\n]+/g, " ");
            if (text) {
                program.add("node.appendChild(document.createTextNode(" + JSON.stringify(text) + "));\n");
            }
        }
        child = child.nextSibling;
    }
}

function negotiateArgument(node, argument, parameter, program, template, name, displayName) {
    program.push();

    program.add("node = {};\n");
    if (parameter.innerText) {
        program.add("node.innerText = " + JSON.stringify(innerText(node)) + ";\n");
    } else if (parameter.innerHTML) {
        program.add("node.innerHTML = " + JSON.stringify(node.innerHTML) + ";\n");
    } else if (parameter.component) {
        var argumentName = defineComponent(node, program, template, name, displayName);
        program.add("node.component = $" + argumentName + ";\n");
    } else if (parameter.components) {
        var child = node.firstChild;
        while (child) {
            if (child.nodeType === 1) {
                var argumentName = defineComponent(child, program, template, name, displayName);
                program.add("node[" + JSON.stringify(child.tagName.toLowerCase()) + "] = $" + argumentName + ";\n");
            }
            child = child.nextSibling;
        }
    }

    var id = node.getAttribute("id");

    // Pass the scope back to the caller
    if (argument.type === "argument") {
        // Instantiate an argument from the template that instantiated this.
        program.add("componentScope = scope.argumentScope;\n");
        // TODO open up the field for argument "as"
        program.add("component = new $ARGUMENT.component(parent, componentScope, node, " + JSON.stringify(id) + ");\n");
    } else if (argument.type === "external") {
        // Pass a chunk of our own template to an external component.
        program.add("componentScope = scope;\n");
        program.add("component = new $" + node.tagName.toUpperCase() + "(parent, componentScope, node, " + JSON.stringify(id) + ");\n");
    }

    program.pop();
}

function defineComponent(node, program, template, name, displayName) {
    var argumentProgram = new Program();
    var argumentSuffix = "$" + (template.nextArgumentIndex++);
    var argumentName = name + argumentSuffix;
    var argumentDisplayName = displayName + argumentSuffix;
    translateArgument(node, argumentProgram, template, argumentName, argumentDisplayName);
    program.addProgram(argumentProgram);
    return argumentName;
}

function Template() {
    this.tags = {};
    this.nextArgumentIndex = 0;
}

Template.prototype.addTag = function (name, tag) {
    tag.name = name;
    this.tags[name] = tag;
};

Template.prototype.hasTag = function (name) {
    return Object.prototype.hasOwnProperty.call(this.tags, name);
};

Template.prototype.getTag = function (name) {
    return this.tags[name];
};

function Program() {
    this.lines = ["\n"];
    this.programs = [];
    this.tabs = [];
}

Program.prototype.addProgram = function (program) {
    this.programs.push(program);
};

Program.prototype.add = function (line) {
    var index = this.lines.length;
    this.lines.push.apply(this.lines, this.tabs);
    this.lines.push(line);
    var until = this.lines.length;
    return [index, until];
};

Program.prototype.push = function () {
    this.add("parents[parents.length] = parent; parent = node;\n");
};

Program.prototype.pop = function () {
    this.add("node = parent; parent = parents[parents.length - 1]; parents.length--;\n");
};

Program.prototype.retract = function (pair) {
    var index = pair[0];
    var until = pair[1];
    while (index < until) {
        this.lines[index] = "";
        index++;
    }
};

Program.prototype.indent = function () {
    this.tabs.push("    ");
};

Program.prototype.exdent = function () {
    this.tabs.pop();
};

Program.prototype.collect = function (lines) {
    lines.push.apply(lines, this.lines);
    this.programs.forEach(function (program) {
        program.collect(lines);
    });
};

Program.prototype.digest = function () {
    var lines = [];
    this.collect(lines);
    lines.push("\n");
    return lines.join("");
};

