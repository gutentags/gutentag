"use strict";

module.exports = Essay;
function Essay() {
}

Essay.prototype.hookup = function hookup(id, component, scope) {
    if (id === "subcomponent:greeting") {
        component.value = "Guten Tag, Welt!";
    }
};
