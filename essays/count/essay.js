"use strict";

module.exports = Essay;
function Essay() {
    this.value = [1, 2, 3];
}

Essay.prototype.add = function (child, id, scope) {
    if (id === "this") {
        this.repeat = scope.repeat;
        scope.repeat.value = this.value;
        scope.rotate.actualNode.addEventListener("click", this);
    } else if (id === "repeat:iteration") {
        scope.text.value = child.value;
    }
};

Essay.prototype.handleEvent = function () {
    this.value.push(this.value.shift());
};
