"use strict";

// TODO create scope for revealed body and add to owner whenever it is created.
// Destroy when retracted, recreate when revealed.

var O = require("pop-observe");

module.exports = Reveal;
function Reveal(body, scope) {
    this.value = false;
    this.observer = O.observePropertyChange(this, "value", this);
    this.body = body;
    this.scope = scope;
    this.Revelation = scope.argument.component;
    this.revelation = null;
    this.revelationBody = null;
    this.revelationScope = null;
}

Reveal.prototype.handleValuePropertyChange = function (value) {
    if (this.revelation) {
        if (this.revelation.destroy) {
            this.revelation.destroy();
        }
        this.body.removeChild(this.revelationBody);
        this.revelation = null;
        this.revelationBody = null;
    }
    if (value) {
        this.revelationScope = this.scope.nestComponents();
        this.revelationBody = this.body.ownerDocument.createBody();
        this.revelation = new this.Revelation(this.revelationBody, this.revelationScope);
        this.revelationScope.add(this.revelation, "revelation", this.scope);
        this.body.appendChild(this.revelationBody);
    }
};

Reveal.prototype.destroy = function () {
    if (this.revelation.destroy) {
        this.revelation.destroy();
    }
    this.observer.cancel();
};
