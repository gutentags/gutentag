"use strict";

module.exports = Essay;
function Essay() {
    this._value = true;
}

Essay.prototype.hookup = function hookup(id, child, scope) {
    var components = scope.components;
    if (id === "this") {
        components.greeting.value = "Guten Tag, Welt!";
        components.display.addEventListener("change", this);
    }
};

Essay.prototype.handleEvent = function handleEvent(event) {
    this.value = !this.value;
};

Object.defineProperty(Essay.prototype, "value", {
    get: function getValue() {
        return this._value;
    },
    set: function setValue(value) {
        this._value = value;
        this.scope.components.greeting.value = value ? "Guten Tag, Welt!" : null;
    }
});
