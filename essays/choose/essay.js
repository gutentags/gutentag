"use strict";

module.exports = Essay;
function Essay() {
}

Essay.prototype.add = function (child, id, scope) {
    var components = scope.components;
    if (id === "buttons:iteration") {
        components.button.actualNode.dataset.value = child.value;
        components.button.actualNode.addEventListener("click", this);
        components.buttonLabel.value = child.value;
    } else if (id === "this") {
        this.buttons = components.buttons;
        this.buttons.value = Object.keys(components.choose.optionConstructors);
        this.choose = components.choose;
    }
};

Essay.prototype.handleEvent = function (event) {
    this.choose.value = event.target.dataset.value;
};

