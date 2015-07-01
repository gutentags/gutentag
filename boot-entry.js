"use strict";

var boot = require("system/boot-entry");
var Document = require("./document");
var Scope = require("./scope");

module.exports = render;
function render() {
    return boot()
    .then(function (Main) {
        var scope = new Scope();
        var document = new Document(window.document.body);
        new Main(document.documentElement, scope);
    });
}

if (require.main === module) {
    render().done();
}
