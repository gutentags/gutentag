"use strict";

// scope: the scope in which this component exists
// this.scope: the scope for this component, in which its child components exist
// this.scope.argument == scope, the scope in which to instantiate the parameter component

var domenic = require("domenic");
var parser = new domenic.DOMParser();

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
    analyzeDocument(document, program, template, module);
    translateDocument(document, program, template, module, "THIS", displayName);
    module.text = program.digest();
    console.log(module.text);
    return module.text;
};

// TODO We need to use this data, but whether space can be trimmed has less to
// do with the parent element and more to do with siblings.
// <div>  a: <span>x</span>,  <span>y</span>  </div>
//      ^^                   ^              ^^
// Custom tags need to be able to express whether and how internal and
// surrounding space should be handled.
// CSS lies.
var inline = {
    A: 1, ABBR: 1, ACRONYM: 1, B: 1, BDO: 1, BIG: 1, BR: 1, BUTTON: 1, CITE: 1,
    CODE: 1, DFN: 1, EM: 1, I: 1, IMG: 1, INPUT: 1, KBD: 1, LABEL: 1, MAP: 1,
    OBJECT: 1, Q: 1, SAMP: 1, SCRIPT: 1, SELECT: 1, SMALL: 1, SPAN: 1,
    STRONG: 1, SUB: 1, SUP: 1, TEXTAREA: 1, TT: 1, VAR: 1
};

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
                    } else if (rel === "tag") {
                        var href = child.getAttribute("href");
                        var as = child.getAttribute("as").toUpperCase();
                        // TODO validate identifier
                        program.add("var $" + as + " = require" + "(" + JSON.stringify(href) + ");\n");
                        module.dependencies.push(href);
                        template.addTag(as, {type: "external", id: href});
                    }
                    // ...
                } else if (child.tagName.toLowerCase() === "meta") {
                    if (child.getAttribute("arguments")) {
                        template.takesArguments = true;
                    }
                    // ...
                }
            }
            child = child.nextSibling;
        }
    }
}

function translateDocument(document, program, template, module, name, displayName) {
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
    return program.digest();
}

function translateBody(body, program, template, name, displayName) {
    program.add("var $" + name + " = function " + displayName + "(body, argumentScope, argumentTemplate, attributes) {\n");
    program.indent();
    program.add("var document = body.ownerDocument;\n");
    program.add("var scope = this.scope = argumentScope.root.nest(this);\n");
    program.add("scope.argument = argumentScope;\n");
    program.add("scope.value = this;\n");
    if (template.takesArguments) {
        program.add("scope.argumentComponents = {};\n");
        program.add("new argumentScope.ArgumentComponent(scope);\n");
    }
    if (body) {
        translateSegment(body, program, template, name, displayName);
    }
    if (template.extends) {
        program.add("$SUPER.apply(this, arguments);\n");
    }
    program.exdent();
    program.add("};\n");
    if (template.extends) {
        program.add("$THIS.prototype = Object.create($SUPER.prototype);\n");
    }
}

function translateArgument(node, program, template, name, displayName) {
    program.add("var $" + name + " = function " + displayName + "(body, scope, fallback, attributes) {\n");
    program.indent();
    program.add("var document = body.ownerDocument;\n");
    translateSegment(node, program, template, name, displayName);
    program.exdent();
    program.add("};\n");
}

function translateSegment(node, program, template, name, displayName) {
    var header = program.add("var parent = body, parents = [], node, component;\n");
    var unused = true;
    var child = node.firstChild;
    while (child) {
        if (child.nodeType === 1 /* domenic.Element.ELEMENT_NODE*/) {
            unused = false;
            translateElement(child, program, template, name, displayName);
        } else if (child.nodeType === 3 /*domenic.Element.TEXT_NODE*/) {
            var text = child.nodeValue;
            if (inline[node.tagName]) {
                text = text.replace(/[\s\n]+/g, " ");
            } else {
                text = text.trim();
            }
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
    var tagName = node.tagName.toLowerCase();
    if (template.hasTag(tagName) || tagName === "this") {
        program.add("node = document.createBody();\n");
        program.add("parent.appendChild(node);\n");
        // TODO argument templates, argumentScope
        // template:
        var argumentProgram = new Program();
        var argumentSuffix = "$" + (template.nextArgumentIndex++);
        var argumentName = name + argumentSuffix;
        var argumentDisplayName = displayName + argumentSuffix;
        translateArgument(node, argumentProgram, template, argumentName, argumentDisplayName);
        program.addProgram(argumentProgram);
        // TODO append to master program, give a name
        // attributes:
        var attys = {};
        for (var attribute, key, value, index = 0, attributes = node.attributes, length = attributes.length; index < length; index++) {
            attribute = attributes.item(index);
            key = attribute.nodeName;
            value = attribute.value || node.nodeValue;
            if (key === "id") {
                continue;
            }
            attys[key] = value;
        }
        // TODO determine and create an appropriate argument scope
        program.add("component = new $" + tagName.toUpperCase() + "(node, scope, $" + argumentName + ", " + JSON.stringify(attys) + ");\n");
        if (id) {
            // TODO optimize for valid identifiers
            program.add("scope.value[" + JSON.stringify(id) + "] = component;\n");
        }
    } else {
        program.add("node = document.createElement(" + JSON.stringify(node.tagName) + ");\n");
        program.add("parent.appendChild(node);\n");
        if (id) {
            // TODO optimize for valid identifiers
            program.add("scope.value[" + JSON.stringify(id) + "] = node;\n");
        }
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
            program.add("parents[parents.length] = parent; parent = node;\n");
            translateElement(child, program, template, name, displayName);
            program.add("node = parent; parent = parents[parents.length - 1]; parents.length--;\n");
        } else if (child.nodeType === 3 /*domenic.Element.TEXT_NODE*/) {
            text = child.nodeValue;
            if (inline[node.tagName]) {
                text = text.replace(/[\s\n]+/g, " ");
            } else {
                text = text.trim();
            }
            if (text) {
                program.add("node.appendChild(document.createTextNode(" + JSON.stringify(text) + "));\n");
            }
        }
        child = child.nextSibling;
    }
}

function Template() {
    this.tagsIndex = {};
    this.tagsArray = [];
    this.nextArgumentIndex = 0;
}

Template.prototype.addTag = function (name, tag) {
    tag.name = name;
    this.tagsIndex[name.toUpperCase()] = tag;
    this.tagsArray.push(tag);
};

Template.prototype.hasTag = function (name) {
    return Object.prototype.hasOwnProperty.call(this.tagsIndex, name.toUpperCase());
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

