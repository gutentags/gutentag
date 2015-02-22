"use strict";

var Scope = require("../scope");
var DOMParser = require("domenic").DOMParser;
var Essay = require("./text.html");
var Document = require("../dom-body");

var parser = new DOMParser();
var actualDocument = parser.parseFromString("<!doctype html><html><body></body></html>", "text/html");
var document = new Document(actualDocument.firstChild.firstChild);
var scope = new Scope();
var essay = new Essay(document.documentElement, scope);
essay.greeting.value = "Guten Tag, Welt!";

expect(actualDocument.firstChild.innerHTML).toBe("<body>  Guten Tag, Welt! </body>");

essay.greeting.value = "Auf Wiederseh'n!";

expect(actualDocument.firstChild.innerHTML).toBe("<body>  Auf Wiederseh'n! </body>");
