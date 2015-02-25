'use strict';

module.exports = outerHTML;
function outerHTML(node) {
    var string;
    if (node.nodeType === 1) {
        string = "";
        string += "<" + node.tagName;
        var attributes = node.attributes;
        for (var index = 0; index < attributes.length; index++) {
            var attribute = attributes.item(index);
            string += " " + attribute.name + "=\"" + enquote(attribute.value) + "\"";
        }
        string += ">";
        string += innerHTML(node);
        string += "</" + node.tagName + ">";
        return string;
    } else if (node.nodeType === 3) {
        return encode(node.data);
    } else if (node.nodeType === 8) {
        return "<!--" + node.data + "-->";
    } else if (node.nodeType === 9) { // document
        string = "";
        if (node.doctype) {
            string += node.doctype;
        }
        string += outerHTML(node.documentElement);
        return string;
    } else {
        return "";
    }
}

var nonAttributeModeSpecialCharRegExp = /[&<>\xA0]/g;
var attributeModeSpecialCharRegExp = /["&<>\xA0]/g;

var specialCharEntities = {
    "&": "&amp;",
    "\"": "&quot;",
    "<": "&lt;",
    ">": "&gt;",
    "\xA0": "&nbsp;"
};

function specialCharToEntity(s) {
    var entity = specialCharEntities[s];
    return entity ? entity : s;
}

function encode(string) {
    return string.replace(nonAttributeModeSpecialCharRegExp, specialCharToEntity);
}

function enquote(string) {
    return string.replace(attributeModeSpecialCharRegExp, specialCharToEntity);
}

var innerHTML = require("./inner-html");
