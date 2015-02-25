"use strict";

module.exports = Switch;
function Switch(body, scope, argument) {
    this.caseConstructors = argument;
    this.cases = {};
    this.bodies = {};
    this.body = body;
    this.scope = scope;
    this._value = null;
}

Object.defineProperty(Switch.prototype, "value", {
    get: function () {
        return this._value;
    },
    set: function (value) {
        this.constructCase(value);
        if (this.value !== null && value !== this._value) {
            this.body.removeChild(this.bodies[this._value]);
        }
        this.body.appendChild(this.bodies[value]);
        this._value = value;
    }
});

Switch.prototype.constructCase = function (value) {
    if (!this.caseConstructors[value]) {
        throw new Error("Can't switch to non-existant case");
    }
    if (!this.cases[value]) {
        var constructor = this.caseConstructors[value];
        this.bodies[value] = this.body.ownerDocument.createBody();
        this.cases[value] = new constructor(this.bodies[value], this.scope);
    }
};

