"use strict";

var Document = require("koerper");
var Scope = require("../../scope");
var Essay = require("./essay.html");

var scope = new Scope();
var document = new Document(window.document.body);
var essay = new Essay(document.documentElement, scope);
essay.scope.components.greetings.value = [1, 2, 3];

