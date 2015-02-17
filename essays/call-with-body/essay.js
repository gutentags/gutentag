"use strict";

module.exports = Essay;
function Essay(body, scope) {
}

Essay.prototype.addChild = function (child, id, scope) {
    if (id === "text") {
        child.value = "Guten Tag, Welt!";
    }
};
