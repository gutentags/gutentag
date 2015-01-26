"use strict";

module.exports = Text;
function Text(body) {
    var node = body.ownerDocument.createTextNode("");
    body.appendChild(node);
    this.node = node;
}

Object.defineProperty(Text.prototype, "value", {
    get: function () {
        return this.node.data;
    },
    set: function (data) {
        this.node.data = data;
    }
});
