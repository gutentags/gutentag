"use strict";

module.exports = Choose;
function Choose(body, scope) {
    this.optionConstructors = scope.argument;
    this.options = {};
    this.bodies = {};
    this.body = body;
    this.scope = scope;
    this._value = null;
}

Object.defineProperty(Choose.prototype, "value", {
    get: function () {
        return this._value;
    },
    set: function (value) {
        this.constructOption(value);
        if (this.value !== null && value !== this._value) {
            this.body.removeChild(this.bodies[this._value]);
        }
        this.body.appendChild(this.bodies[value]);
        this._value = value;
    }
});

Choose.prototype.constructOption = function (value) {
    if (!this.optionConstructors[value]) {
        throw new Error("Can't switch to non-existant option");
    }
    if (!this.options[value]) {
        var constructor = this.optionConstructors[value];
        this.bodies[value] = this.body.ownerDocument.createBody();
        this.options[value] = new constructor(this.bodies[value], this.scope);
    }
};

Choose.prototype.destroy = function () {
    for (var name in this.options) {
        var child = this.options[name];
        if (child.destroy) {
            child.destroy();
        }
    }
};
