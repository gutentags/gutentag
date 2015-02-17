"use strict";

var translate = require("./translate");

module.exports = function translateHtml(module) {
    return translate(module, "text/html");
};

