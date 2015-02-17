
module.exports = Essay;
function Essay() {
}

Essay.prototype.addChild = function (child, id, scope) {
    if (id === "repeat") {
        this.repeat = child;
    } else if (id === "text") {
        var iteration = scope.value;
        child.value = iteration.value;
    }
};

