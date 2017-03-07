"use strict";

var translate = require("./translate");

module.exports = Template;

function Template() {
    this.tags = {};
    this.attributes = {};
    this.exportNames = {};
    this.nextArgumentIndex = 0;
}

Template.prototype.addTag = function (name, tag) {
    this.tags[name] = tag;
};

Template.prototype.hasTag = function (name) {
    return Object.prototype.hasOwnProperty.call(this.tags, name);
};

Template.prototype.getTag = function (name) {
    return this.tags[name];
};

Template.prototype.addAttribute = function (name, attribute) {
    this.attributes[name] = attribute;
};

Template.prototype.hasAttribute = function (name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name);
};

Template.prototype.getAttribute = function (name) {
    return this.attributes[name];
};

Template.prototype.nextArgumentSuffix = function nextArgumentSuffix() {
    return "$" + (this.nextArgumentIndex++);
};
