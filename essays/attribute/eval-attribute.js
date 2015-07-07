"use strict";
var Q = require("q");
module.exports = setAttribute;
function setAttribute(component, key, value, scope) {
    // At the time this attribute is instantiated, the lexical scope has not
    // necessarily been entirely populated.
    // With a binding system, this is not a problem because it will react to
    // the creation and introductionof the relevant objects.
    // But, since this is a hacky proof of concept using eval, we side-step the
    // issue by waiting for a subsequent event for the entire tree to be
    // created.
    var setup = Function("scope", value);
    Q().done(function () {
        setup.call(component, scope);
    });
}
