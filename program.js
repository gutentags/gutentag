"use strict";

var Document = require("wizdom");

module.exports = Program;
function Program() {
    Document.call(this);
    this.documentElement = this.createElement("body");
}

Program.prototype = Object.create(Document.prototype);
Program.prototype.constructor = Program;

Program.prototype.Element = Section;

Program.prototype.digest = function digest() {
    return digestNode(this.documentElement, '');
};

function Section(ownerDocument, tagName) {
    Document.prototype.Element.call(this, ownerDocument, tagName);
}

Section.prototype = Object.create(Document.prototype.Element.prototype);
Section.prototype.constructor = Section;

Section.prototype.add = function add(text) {
    var child = this.ownerDocument.createTextNode(text);
    this.appendChild(child);
    return child;
};

Section.prototype.addSection = function addSection(type, name) {
    var section = this.ownerDocument.createElement(type);
    section.name = name;
    this.appendChild(section);
    return section;
};

Section.prototype.indent = function indent(name) {
    return this.addSection("indent", name);
};

Section.prototype.push = function () {
    this.add("parents[parents.length] = parent; parent = node;\n");
};

Section.prototype.pop = function () {
    this.add("node = parent; parent = parents[parents.length - 1]; parents.length--;\n");
};

function digestNode(node, prefix) {
    if (node.nodeType === 1) {
        var string = '';
        if (node.tagName === 'indent') {
            if (node.name) {
                string += prefix + '// ' + node.name + '\n';
            }
            prefix = prefix + '    ';
        }
        var currentNode = node.firstChild;
        while (currentNode) {
            string += digestNode(currentNode, prefix);
            currentNode = currentNode.nextSibling;
        }
        return string;
    } else if (node.nodeType === 3) {
        return prefix + node.data;
    } else {
        return "";
    }
};

