"use strict";

module.exports = Essay;
function Essay() {
}

Essay.prototype.add = function (child, id, scope) {
    var components = scope.components;
    if (id === "items:row") {
        components.item.value = child.value;
    } else if (id === "this") {
        components.items.value = ["Guten Tag, Welt!", "Auf Widerseh'n, Welt!"];
    }
};

