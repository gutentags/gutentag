"use strict";

var ObservableObject = require("collections/observable-object");

module.exports = Reveal;
function Reveal(body, scope, argument) {
    this.value = false;
    ObservableObject.observePropertyChange(this, "value", this);
    this.body = body;
    this.scope = scope;
    this.childConstructor = argument.component;
    this.child = null;
    this.childBody = null;
}

Reveal.prototype.handleValuePropertyChange = function (value) {
    if (value) {
        if (!this.child) {
            this.constructChild();
        }
        this.body.appendChild(this.childBody);
    } else {
        this.body.removeChild(this.childBody);
    }
};

Reveal.prototype.constructChild = function () {
    var body = this.body;
    var constructor = this.childConstructor;
    this.childBody = body.ownerDocument.createBody();
    this.child = new constructor(this.childBody, this.scope);
};

Reveal.prototype.destroy = function () {
    this.child.destroy();
};
