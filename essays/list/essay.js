"use strict";

module.exports = Essay;
function Essay() {
}

Essay.prototype.hookup = function hookup(id, child, scope) {
    var components = scope.components;
    if (id === "items:row") {
        components.item.value = child.value;
    } else if (id === "this") {
        components.items.value = ["Guten Tag, Welt!", "Auf Widerseh'n, Welt!"];
    }
};

