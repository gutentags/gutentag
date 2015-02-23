"use strict";

var parseInto = require("../../dom/parse5");
var outerHTML = require("../../dom/outer-html");
var Document = require("../../dom");

it("round trips", function () {
    var document = new Document();
    var input = "<!doctype html><html><head> </head><body><div a=\"&quot;\"></div> &nbsp; <!-- &amp; --></body></html>";
    parseInto(input, document);
    var output = outerHTML(document);
    expect(output).toBe(input);
});

