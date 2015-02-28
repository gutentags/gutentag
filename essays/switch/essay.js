"use strict";

module.exports = Essay;
function Essay() {
}

Essay.prototype.addChild = function (child, id, scope) {
    if (id === "switch") {
        this.switch = child;
        this.buttons.value = Object.keys(this.switch.caseConstructors);
    } else if (id === "buttons") {
        this.buttons = child;
    } else if (id === "button") {
        child.actualNode.dataset.value = scope.buttonsIteration.value;
        child.actualNode.addEventListener("click", this);
    } else if (id === "buttonLabel") {
        child.value = scope.buttonsIteration.value;
    }
};

Essay.prototype.handleEvent = function (event) {
    this.switch.value = event.target.dataset.value;
};

