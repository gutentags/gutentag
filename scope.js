"use strict";

module.exports = Scope;
function Scope() {
    this.root = this;
    this.components = Object.create(null);
}

Scope.prototype.nest = function () {
    var child = Object.create(this);
    child.parent = this;
    child.caller = this.caller && this.caller.nest();
    return child;
};

Scope.prototype.nestComponents = function () {
    var child = this.nest();
    child.components = Object.create(this.components);
    return child;
};

Scope.prototype.set = function (id, component) {
    var scope = this;
    scope.components[id] = component;

    if (scope.this.add) {
        scope.this.add(component, id, scope);
    }

    var exportId = scope.this.exports && scope.this.exports[id];
    if (exportId) {
        var callerId = scope.caller.id;
        scope.caller.set(callerId + ":" + exportId, component);
    }
};
