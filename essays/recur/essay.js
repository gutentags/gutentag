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

Essay.prototype.addChild = function (child, id, scope) {
    if (child.tagName === "BUTTON") {
        child.actualNode.dataset.action = id;
        child.actualNode.addEventListener("click", this);
    }
    if (id === "children") {
        this.children = child;
    } else if (id === "label") {
        this.label = child;
    } else if (id === "child") {
        child.value = scope.childrenIteration.value;
    }
};

Essay.prototype.handleEvent = function (event) {
    console.log('click', event.target.dataset.action);
    var action = event.target.dataset.action;
    if (action === "add") {
        this.children.values.push(this.nextValue++);
    } else if (action === "sub") {
        this.parent.removeChild(this.value);
    }
};

Essay.prototype.removeChild = function (value) {
    var index = this.children.values.indexOf(value);
    this.children.values.splice(index, 1);
};
