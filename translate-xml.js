"use strict";

var translate = require("./translate");

module.exports = function translateHtml(text, module) {
    return translate(module, "application/xml");
};

