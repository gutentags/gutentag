"use strict";

var Document = require("../../dom-body");
var Scope = require("../../scope");
var Essay = require("./essay.html");

var scope = new Scope();
var document = new Document(window.document.body);
var essay = new Essay(document.documentElement, scope);
essay.scope.greeting.value = true;

setInterval(function () {
    essay.scope.greeting.value = !essay.greeting.value;
}, 1000);
