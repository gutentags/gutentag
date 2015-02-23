
var parse5 = require("parse5");
var outerHTML = require("./outer-html");

module.exports = parseInto;
function parseInto(string, document) {
    var builder = new Builder(document);
    var parser = new parse5.SimpleApiParser(builder);
    parser.parse(string);
}

function Builder(document) {
    this.document = document;
    this.currentNode = null;
    this.doctype = this.doctype.bind(this);
    this.startTag = this.startTag.bind(this);
    this.endTag = this.endTag.bind(this);
    this.text = this.text.bind(this);
    this.comment = this.comment.bind(this);
}

Builder.prototype.doctype = function (name, publicId, systemId) {
    this.document.doctype = "<!doctype " + name + ">";
};

Builder.prototype.startTag = function (tagName, attributes, selfClosing) {
    var node = this.document.createElement(tagName);
    attributes.forEach(function (attribute) {
        node.setAttribute(attribute.name, attribute.value);
    });
    if (this.currentNode) {
        this.currentNode.appendChild(node);
    } else {
        this.document.documentElement = node;
    }
    if (!selfClosing) {
        this.currentNode = node;
    }
};

Builder.prototype.endTag = function () {
    this.currentNode = this.currentNode.parentNode;
};

Builder.prototype.text = function (text) {
    this.currentNode.appendChild(this.document.createTextNode(text));
};

Builder.prototype.comment = function (text) {
    this.currentNode.appendChild(this.document.createComment(text));
};

