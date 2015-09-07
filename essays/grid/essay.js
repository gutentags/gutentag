"use strict";

module.exports = Essay;
function Essay() {
}

Essay.prototype.hookup = function hookup(id, child, scope) {
    if (id === "this") {
        scope.components.grid.value = {
            value: [
                ['A1', 'B1'],
                ['A2', 'B2']
            ],
            columns: [
                {label: "A", key: 0},
                {label: "B", key: 1}
            ],
            rows: [
                {label: "0", key: 0},
                {label: "1", key: 1}
            ]
        };
    } else if (id === "grid:ch") {
        scope.components.ch.value = child.value.label;
    } else if (id === "grid:rh") {
        scope.components.rh.value = child.value.label;
    } else if (id === "grid:cd") {
        scope.components.cd.value = child.value;
    }
};

