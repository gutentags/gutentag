"use strict";

module.exports = Essay;
function Essay() {
}

Essay.prototype.add = function (child, id, scope) {
    if (id === "text") {
        child.value = "Guten Tag, Welt!";
    }
};
