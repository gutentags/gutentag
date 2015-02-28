"use strict";

var Document = require("../../dom-body");
var Scope = require("../../scope");
var Essay = require("./essay.html");

var scope = new Scope();
var document = new Document(window.document.body);
var essay = new Essay(document.documentElement, scope);

var values = [1, 2, 3];

essay.repeat.value = values;
setInterval(function () {
    var value = values.shift();
    values.push(value);
}, 1000);
