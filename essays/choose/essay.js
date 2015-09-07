"use strict";

module.exports = Essay;
function Essay() {
}

Essay.prototype.hookup = function (id, child, scope) {
    var components = scope.components;
    if (id === "buttons:iteration") {
        components.button.dataset.value = child.value;
        components.button.addEventListener("click", this);
        components.buttonLabel.value = child.value;
    } else if (id === "this") {
        this.buttons = components.buttons;
        this.buttons.value = Object.keys(components.choose.choices);
        this.choose = components.choose;
    }
};

Essay.prototype.handleEvent = function (event) {
    this.choose.value = event.target.dataset.value;
};

