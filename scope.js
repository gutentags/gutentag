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

Scope.prototype.add = function (component, name, scope) {
    var componentScope = this;
    do {
        var id = scope.id + ":" + name;
        componentScope[id] = component;
        if (scope.this.add) {
            scope.this.add(component, id, componentScope);
        }
        name = scope.this.exports && scope.this.exports[id];
        scope = scope.caller;
        componentScope = componentScope.caller;
    } while (name);
};
