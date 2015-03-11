"use strict";

module.exports = Html;
function Html(body, scope) {
    var node = body.ownerDocument.createBody();
    body.appendChild(node);
    this.node = node;
    this.defaultHtml = scope.argument.innerHTML;
    this.value = null;
}

Object.defineProperty(Html.prototype, "value", {
    get: function () {
        return this.node.innerHTML;
    },
    set: function (value) {
        if (value == null) {
            value = this.defaultHtml;
        } else if (typeof value !== "string") {
            throw new Error("HTML component only accepts string values");
        }
        this.node.innerHTML = value;
    }
});
