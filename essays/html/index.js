"use strict";

var Document = require("../../dom-body");
var Scope = require("../../scope");
var Essay = require("./essay.html");

var scope = new Scope();
var document = new Document(window.document.body);
var essay = new Essay(document.documentElement, scope);

setTimeout(function () {
    essay.scope.greeting.value = "<b>Guten Tag</b>, <i>Welt</i>!";
}, 1000);
