"use strict";

module.exports = Essay;
function Essay() {
}

Essay.prototype.hookup = function hookup(id, child, scope) {
    if (id === "text") {
        child.value = "Guten Tag, Welt!";
    }
};
