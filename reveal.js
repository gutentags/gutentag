"use strict";

var ObservableObject = require("collections/observable-object");

module.exports = Reveal;
function Reveal(body, scope, Template) {
    this.value = false;
    ObservableObject.observePropertyChange(this, "value", this);
    this.body = body;
    this.childBody = body.ownerDocument.createBody();
    this.child = new Template(this.childBody, scope);
}

Reveal.prototype.handleValuePropertyChange = function (value) {
    if (value) {
        this.body.appendChild(this.childBody);
    } else {
        this.body.removeChild(this.childBody);
    }
};

Reveal.prototype.destroy = function () {
    this.child.destroy();
};
