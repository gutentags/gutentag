"use strict";

module.exports = Essay;
function Essay() {
    this.value = [1, 2, 3];
}

Essay.prototype.add = function (child, id, scope) {
    if (id === "this") {
        this.repeat = scope.components.repeat;
        scope.components.repeat.value = this.value;
        scope.components.rotate.actualNode.addEventListener("click", this);
    } else if (id === "repeat:iteration") {
        scope.components.text.value = child.value;
    }
};

Essay.prototype.handleEvent = function () {
    this.value.push(this.value.shift());
};
