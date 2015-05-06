"use strict";

// scope: the scope in which this component exists
// this.scope: the scope for this component, in which its child components exist
// this.scope.argument == scope, the scope in which to instantiate the parameter component

var Q = require("q");
var domenic = require("domenic");
var parser = new domenic.DOMParser();
var Program = require("./program");
var parseAccepts = require("./accepts-parser").parse;
var translateParameter = require("./translate-parameter");
var negotiateArgument = require("./translate-argument");

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
        part = part.replace(/[^a-zA-Z0-9]/g, "");
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }).join("");
    if (!/[A-Z]/.test(displayName[0])) {
        displayName = "_" + displayName;
    }
    var document = parser.parseFromString(module.text, type);
    var program = new Program();
    var section = program.documentElement;
    var template = new Template();
    section.add('"use strict";\n');
    module.dependencies = [];
    module.neededTags = {};
    analyzeDocument(document, section, template, module);
    return Q.all(Object.keys(module.neededTags).map(function (name) {
        var href = module.neededTags[name];
        return module.require.load(href)
        .then(function () {
            template.getTag(name).module = module.require.lookup(href);
        });
    })).then(function () {
        translateDocument(
            document,
            section.addSection("body"),
            template,
            module,
            "THIS",
            displayName
        );
        module.text = program.digest();
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
    template.addTag("THIS", {type: "external", module: module, name: "THIS"});
    module.parameter = {};
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
                        template.addTag("SUPER", {type: "super", name: "SUPER"});
                    } else if (rel === "exports") {
                        var href = child.getAttribute("href");
                        template.exports = href;
                        module.dependencies.push(href);
                    } else if (rel === "tag") {
                        var href = child.getAttribute("href");
                        var as = child.getAttribute("as");
                        if (!as) {
                            as = /([^\/]+)\.(?:html|xml)$/.exec(href);
                            as = as[1];
                        }
                        as = as.toUpperCase();
                        var name = as.replace(/[^A-Za-z0-9_]/g, '_');
                        // TODO validate identifier
                        program.add("var $" + name + " = require" + "(" + JSON.stringify(href) + ");\n");
                        module.neededTags[as] = href;
                        module.dependencies.push(href);
                        template.addTag(as, {type: "external", id: href, name: name});
                    }
                    // ...
                } else if (child.tagName.toLowerCase() === "meta") {
                    if (child.getAttribute("accepts")) {
                        var accepts = child.getAttribute("accepts");
                        var syntax = parseAccepts(accepts);
                        var parameter = {};
                        module.parameter = syntax;
                        translateParameter(
                            syntax,
                            template,
                            "callee.argument",
                            child.getAttribute("as") || "argument"
                        );
                    } else if (child.getAttribute("exports")) {
                        var name = child.getAttribute("exports");
                        var as = child.getAttribute("as");
                        template.exportNames[name] = as;
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
                    translateBody(
                        child,
                        program.addSection("element"),
                        template,
                        name,
                        displayName
                    );
                }
            }
            child = child.nextSibling;
        }
        program.add("module.exports = $THIS;\n");
    }
}

function translateBody(body, program, template, name, displayName) {
    program.add("var $" + name + " = function " + displayName + "(body, caller) {\n");
    var bodyProgram = program.indent();
    program.add("};\n");

    // Trailing inheritance declarations
    if (template.extends) {
        program.add("$THIS.prototype = Object.create($SUPER.prototype);\n");
        program.add("$THIS.prototype.constructor = $THIS;\n");
    }
    program.add("$THIS.prototype.exports = " + JSON.stringify(template.exportNames) + ";\n");

    // Call super constructor
    if (template.extends) {
        bodyProgram.add("$SUPER.apply(this, arguments);\n");
    }

    // Establish the component and its scope
    bodyProgram.add("var document = body.ownerDocument;\n");
    bodyProgram.add("var scope = this.scope = caller.root.nestComponents();\n");
    // caller is the argument scope
    // caller.argument is the argument template(s)
    bodyProgram.add("scope.caller = caller;\n");
    bodyProgram.add("scope.this = this;\n");

    // Build out the body
    translateSegment(
        body,
        bodyProgram.addSection("segment"),
        template,
        name,
        displayName,
        false
    );

    // Note "this" in scope.
    // This is a good hook for final wiring.
    bodyProgram.add("this.scope.set(\"this\", this);\n");
}

function translateArgument(node, program, template, name, displayName, significantSpace) {
    program.add("var $" + name + " = function " + displayName + "(body, caller) {\n");
    var argumentProgram = program.indent();
    argumentProgram.add("var document = body.ownerDocument;\n");
    argumentProgram.add("var scope = this.scope = caller;\n");
    translateSegment(
        node,
        argumentProgram.addSection("segment"),
        template,
        name,
        displayName,
        significantSpace
    );
    program.add("};\n");
}

function translateSegment(node, program, template, name, displayName, significantSpace) {
    var header = program.add("var parent = body, parents = [], node, component, callee, argument;\n");
    var unused = translateFragment(
        node,
        program.addSection("fragment"),
        template,
        name,
        displayName,
        significantSpace
    );
    if (unused) {
        program.removeChild(header);
    }
}

function translateFragment(node, program, template, name, displayName, significantSpace) {
    var child = node.firstChild;
    var text;
    var unused = true;
    while (child) {
        if (child.nodeType === 1 /*domenic.Element.ELEMENT_NODE*/) {
            translateElement(
                child,
                program.addSection("element"),
                template,
                name,
                displayName,
                significantSpace
            );
            unused = false;
        } else if (child.nodeType === 3 /*domenic.Element.TEXT_NODE*/) {
            text = child.nodeValue;
            if (significantSpace) {
                text = text.replace(/[\s\n]+/g, " ");
            } else {
                text = text.trim();
            }
            if (text) {
                program.add("parent.appendChild(document.createTextNode(" + JSON.stringify(text) + "));\n");
                unused = false;
            }
        }
        child = child.nextSibling;
    }
    return unused;
}

function translateElement(node, program, template, name, displayName, significantSpace) {
    var id = node.getAttribute("id");
    var tagName = node.tagName.toUpperCase();
    var argumentTag = template.getTag(tagName);

    if (tagName === "SP") {
        return translateFragment(
            node,
            program.addSection("fragment"),
            template,
            name,
            displayName,
            true
        );
    }

    if (argumentTag) {
        program.add("node = document.createBody();\n");
    } else {
        program.add("node = document.createElement(" + JSON.stringify(node.tagName) + ");\n");
    }

    program.add("parent.appendChild(node);\n");

    var component;
    if (argumentTag && argumentTag.module.parameter) {
        constructArgument(
            node,
            argumentTag,
            argumentTag.module.parameter,
            program,
            template,
            name,
            displayName
        );
    } else {
        component = program.add("component = node;\n");
    }

    // Introduce new component or node to its owner.
    if (id) {
        program.add("scope.set(" + JSON.stringify(id) + ", component);\n");
    } else if (component) {
        program.removeChild(component);
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
        program.push();
        translateFragment(
            node,
            program.indent(node.tagName),
            template,
            name,
            displayName,
            significantSpace
        );
        program.pop();
    }
}

function constructArgument(node, argument, parameter, program, template, name, displayName) {
    program.push();
    var argumentProgram = program.indent(node.tagName);
    program.pop();
    program = argumentProgram;

    negotiateArgument(node, parameter, program, template, name, displayName);

    // Pass the scope back to the caller
    var name;
    var id = node.getAttribute("id");
    if (argument.type === "argument") {
        name = argument.name + ".component";
        program.add("callee = scope.caller.nest();\n");
        program.add("if (" + argument.name + ") {\n");
        program.add("    callee.id = " + JSON.stringify(id) + ";\n");
        program.add("    component = new " + name + "(parent, callee);\n");
        // Default template fallback if optional component not provided.
        program.add("} else {\n");
        program.add("    component = new node.component(parent, scope);\n");
        program.add("}\n");
        // Instantiate an argument from the template that instantiated this.
    } else if (argument.type === "external") {
        // Pass a chunk of our own template to an external component.
        program.add("callee = scope.nest();\n");
        program.add("callee.argument = node;\n");
        name = "$" + argument.name;
        program.add("callee.id = " + JSON.stringify(id) + ";\n");
        program.add("component = new " + name + "(parent, callee);\n");
    }

}

function Template() {
    this.tags = {};
    this.exportNames = {};
    this.nextArgumentIndex = 0;
}

Template.prototype.addTag = function (name, tag) {
    this.tags[name] = tag;
};

Template.prototype.hasTag = function (name) {
    return Object.prototype.hasOwnProperty.call(this.tags, name);
};

Template.prototype.getTag = function (name) {
    return this.tags[name];
};

Template.prototype.defineComponent =
function defineComponent(node, program, name, displayName) {
    var argumentProgram = program.ownerDocument.documentElement.addSection("argument");
    var argumentSuffix = "$" + (this.nextArgumentIndex++);
    var argumentName = name + argumentSuffix;
    var argumentDisplayName = displayName + argumentSuffix;
    translateArgument(
        node,
        argumentProgram.addSection("argument"),
        this,
        argumentName,
        argumentDisplayName
    );
    return argumentName;
}

