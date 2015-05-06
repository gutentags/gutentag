"use strict";

module.exports = Essay;
function Essay() {
}

Essay.prototype.add = function (component, id, scope) {
    if (id === "subcomponent:greeting") {
        component.value = "Guten Tag, Welt!";
    }
};
