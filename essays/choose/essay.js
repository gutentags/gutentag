"use strict";

module.exports = Essay;
function Essay() {
}

Essay.prototype.add = function (child, id, scope) {
    if (id === "buttons:iteration") {
        scope.button.actualNode.dataset.value = child.value;
        scope.button.actualNode.addEventListener("click", this);
        scope.buttonLabel.value = child.value;
    } else if (id === "this") {
        this.buttons = scope.buttons;
        this.buttons.value = Object.keys(scope.choose.optionConstructors);
        this.choose = scope.choose;
    }
};

Essay.prototype.handleEvent = function (event) {
    this.choose.value = event.target.dataset.value;
};

