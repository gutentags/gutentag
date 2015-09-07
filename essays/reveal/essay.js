"use strict";

module.exports = Essay;
function Essay() {
    this.value = false;
}

Essay.prototype.hookup = function hookup(id, child, scope) {
    if (id === "this") {
        scope.components.display.addEventListener("change", this);
    }
}

Essay.prototype.handleEvent = function handleEvent() {
    this.value = !this.value;
    this.scope.components.greeting.value = this.value;
}
