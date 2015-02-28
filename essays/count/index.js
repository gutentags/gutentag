"use strict";

var Document = require("../../dom-body");
var Scope = require("../../scope");
var Essay = require("./essay.html");

var scope = new Scope();
var document = new Document(window.document.body);
var essay = new Essay(document.documentElement, scope);
essay.repeat.value = [1, 2, 3];

setInterval(function () {
    var value = essay.repeat.value.shift();
    essay.repeat.value.push(value);
}, 1000);
