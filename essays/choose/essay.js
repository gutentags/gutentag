"use strict";

module.exports = Essay;
function Essay() {
}

Essay.prototype.add = function (child, id, scope) {
    if (id === "choose") {
        this.choose = child;
        this.buttons.value = Object.keys(this.choose.optionConstructors);
    } else if (id === "button") {
        child.actualNode.addEventListener("click", this);
    } else if (id === "buttons") {
        this.buttons = child;
    } else if (id === "buttonsIteration") {
        scope.button.actualNode.dataset.value = child.value;
        scope.buttonLabel.value = child.value;
    }
};

Essay.prototype.handleEvent = function (event) {
    this.choose.value = event.target.dataset.value;
};

