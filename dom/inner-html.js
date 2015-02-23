'use strict';

module.exports = innerHTML;
function innerHTML(node) {
    var string = '';
    var currentNode = node.firstChild;
    while (currentNode) {
        string += outerHTML(currentNode);
        currentNode = currentNode.nextSibling;
    }
    return string;
}

var outerHTML = require("./outer-html");
