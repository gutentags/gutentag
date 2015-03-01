"use strict";

module.exports = Essay;
function Essay() {
}

Essay.prototype.add = function (child, id, scope) {
    if (id === "repeat") {
        this.repeat = child;
    } else if (id === "repeatIteration") {
        var iteration = scope.repeatIteration;
        scope.text.value = iteration.value;
    }
};

