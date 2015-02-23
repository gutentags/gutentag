'use strict';

module.exports = innerText;
function innerText(node) {
    var string;
    if (node.nodeType === 1) {
        var string = '';
        var currentNode = node.firstChild;
        while (currentNode) {
            string += innerText(currentNode);
            currentNode = currentNode.nextSibling;
        }
        return string;
    } else if (node.nodeType === 3) {
        return node.data;
    } else {
        return "";
    }
}
