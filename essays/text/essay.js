"use strict";

module.exports = Essay;
function Essay() {
    this._value = true;
}

Essay.prototype.add = function (child, id, scope) {
    var components = scope.components;
    if (id === "this") {
        components.greeting.value = "Guten Tag, Welt!";
        components.display.addEventListener("change", this);
    }
};

Essay.prototype.handleEvent = function (event) {
    this.value = !this.value;
};

Object.defineProperty(Essay.prototype, "value", {
    get: function () {
        return this._value;
    },
    set: function (value) {
        this._value = value;
        this.scope.components.greeting.value = value ? "Guten Tag, Welt!" : null;
    }
});
