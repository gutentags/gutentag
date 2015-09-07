"use strict";
module.exports = Main;
function Main() {
    this.ticks60 = [];
    for (var i = 0; i < 60; i++) {
        this.ticks60.push(i * 6);
    }
    this.ticks12 = [];
    for (var i = 0; i < 12; i++) {
        this.ticks12.push(i * 6 * 5);
    }
}
Main.prototype.hookup = function hookup(id, component, scope) {
    if (id === "this") {
        scope.components.ticks60.value = this.ticks60;
        scope.components.ticks12.value = this.ticks12;
    } else if (id === "ticks60:iteration") {
        scope.components.tick.style.transform = "translate(200px, 200px) rotate(" + component.value + "deg) translateY(180px)";
    } else if (id === "ticks12:iteration") {
        scope.components.tick.style.transform = "translate(200px, 200px) rotate(" + component.value + "deg) translateY(180px)";
    }
};
