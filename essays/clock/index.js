"use strict";

var Document = require("../../document");
var Scope = require("../../scope");
var Main = require("./main.html");

var scope = new Scope();
var document = new Document(window.document.body);
var main = new Main(document.documentElement, scope);
