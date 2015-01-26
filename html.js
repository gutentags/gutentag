"use strict";

module.exports = Html;
function Html(body) {
    var node = body.ownerDocument.createBody();
    body.appendChild(node);
    this.node = node;
}

Object.defineProperty(Html.prototype, "value", {
    get: function () {
        return this.node.innerHTML;
    },
    set: function (value) {
        this.node.innerHTML = value;
    }
});
