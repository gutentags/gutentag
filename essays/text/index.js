"use strict";

var Document = require("../../dom-body");
var Scope = require("../../scope");
var Essay = require("./essay.html");

var scope = new Scope();
var document = new Document(window.document.body);
var essay = new Essay(document.documentElement, scope);
essay.greeting.value = "Guten Tag, Welt!";

var toggle = true;
setInterval(function () {
    toggle = !toggle;
    if (toggle) {
        essay.greeting.value = "Guten Tag, Welt!";
    } else {
        essay.greeting.value = null;
    }
}, 1000);
