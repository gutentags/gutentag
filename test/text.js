"use strict";

var Scope = require("../scope");
var DOMParser = require("domenic").DOMParser;
var Essay = require("./text.html");
var Document = require("koerper");

var parser = new DOMParser();
var actualDocument = parser.parseFromString("<!doctype html><html><head></head><body></body></html>", "text/html");
var body = actualDocument.firstChild.nextSibling.firstChild.nextSibling;
var document = new Document(body);
var scope = new Scope();
var essay = new Essay(document.documentElement, scope);
essay.scope.components.greeting.value = "Guten Tag, Welt!";

expect(body.innerHTML).toBe("Guten Tag, Welt!");

essay.scope.components.greeting.value = "Auf Wiederseh'n!";

expect(body.innerHTML).toBe("Auf Wiederseh'n!");
