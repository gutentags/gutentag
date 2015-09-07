"use strict";
module.exports = Grid;

function Grid() {
}

Object.defineProperty(Grid.prototype, "value", {
    get: function () {
        return this._value;
    },
    set: function (value) {
        this._value = value;
        if (value) {
            this.columns.value = value.columns;
            this.rows.value = value.rows;
        }
    }
});

Grid.prototype.hookup = function hookup(id, component, scope) {
    if (id === "this") {
        this.columns = scope.components.columns;
        this.rows = scope.components.rows;
    } else if (id === "rows:iteration") {
        scope.components.cells.value = this.value.columns.map(function (column) {
            return this.value.value[component.value.key][column.key];
        }, this);
    }
};

