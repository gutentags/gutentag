"use strict";

module.exports = Choose;
function Choose(body, scope) {
    this.choices = scope.argument.children;
    this.choice = null;
    this.choiceBody = null;
    this.choiceScope = null;
    this.body = body;
    this.scope = scope;
    this._value = null;
}

Object.defineProperty(Choose.prototype, "value", {
    get: function () {
        return this._value;
    },
    set: function (value) {
        if (!this.choices[value]) {
            throw new Error("Can't switch to non-existant option");
        }

        if (value === this._value) {
            return;
        }
        this._value = value;

        if (this.choice) {
            if (this.choice.destroy) {
                this.choice.destroy();
            }
            this.body.removeChild(this.choiceBody);
        }

        this.choiceBody = this.body.ownerDocument.createBody();
        this.choiceScope = this.scope.nestComponents();
        this.choice = new this.choices[value](this.choiceBody, this.choiceScope);
        this.choiceScope.add(this.choice, value, this.scope);
        this.body.appendChild(this.choiceBody);
    }
});


Choose.prototype.destroy = function () {
    for (var name in this.options) {
        var child = this.options[name];
        if (child.destroy) {
            child.destroy();
        }
    }
};
