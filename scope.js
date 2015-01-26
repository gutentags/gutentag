"use strict";

module.exports = Scope;
function Scope() {
    this.root = this;
}

Scope.prototype = Object.create(null);

Scope.prototype.nest = function () {
    var child = Object.create(this);
    child.parent = this;
    return child;
};
