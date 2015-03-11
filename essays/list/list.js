"use strict";

module.exports = List;
function List() {
}

Object.defineProperty(List.prototype, "value", {
    get: function () {
        return this.scope.components.rows.value;
    },
    set: function (value) {
        this.scope.components.rows.value = value;
    }
});
