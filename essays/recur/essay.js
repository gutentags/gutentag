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

Essay.prototype.add = function (child, id, scope) {
    if (child.tagName === "BUTTON") {
        child.actualNode.dataset.action = id;
        child.actualNode.addEventListener("click", this);
    }
    if (id === "children") {
        this.children = child;
    } else if (id === "label") {
        this.label = child;
    } else if (id === "childrenIteration") {
        scope.child.value = child.value;
    } else if (id === "revealSub") {
        child.value = !!scope.caller.this;
    }
};

Essay.prototype.handleEvent = function (event) {
    var action = event.target.dataset.action;
    if (action === "add") {
        this.children.value.push(this.nextValue++);
    } else if (action === "sub") {
        this.parent.removeChild(this.value);
    }
};

Essay.prototype.removeChild = function (value) {
    var index = this.children.value.indexOf(value);
    this.children.value.splice(index, 1);
};
