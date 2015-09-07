"use strict";

module.exports = Essay;
function Essay(body, scope) {
    this.parent = scope.this;
    this.nextValue = 0;
    this._value = null;
}

Object.defineProperty(Essay.prototype, "value", {
    get: function () {
        return this._value;
    },
    set: function (value) {
        this._value = value;
        this.label.value = value;
    }
});

Essay.prototype.hookup = function hookup(id, child, scope) {
    if (child.tagName === "BUTTON") {
        child.dataset.action = id;
        child.addEventListener("click", this);
    }
    if (id === "children:iteration") {
        scope.components.child.value = child.value;
    } else if (id === "this") {
        this.children = scope.components.children;
        this.label = scope.components.label;
        scope.components.revealSub.value = !!scope.caller.this;
    }

};

Essay.prototype.handleEvent = function handleEvent(event) {
    var action = event.target.dataset.action;
    if (action === "add") {
        this.children.value.push(this.nextValue++);
    } else if (action === "sub") {
        this.parent.removeChild(this.value);
    }
};

Essay.prototype.removeChild = function removeChild(value) {
    var index = this.children.value.indexOf(value);
    this.children.value.splice(index, 1);
};
