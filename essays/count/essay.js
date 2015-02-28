'use strict';

module.exports = Essay;
function Essay() {
}

Essay.prototype.add = function (child, id, scope) {
    if (id === "repeat") {
        this.repeat = child;
    } else if (id === "text") {
        var iteration = scope.repeatIteration;
        child.value = iteration.value;
    }
};

