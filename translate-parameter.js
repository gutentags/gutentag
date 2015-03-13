"use strict";

module.exports = translateParameter;
function translateParameter(syntax, template, name, as) {
    if (syntax.type === "body") {
        template.addTag(as.toUpperCase(), {
            type: "argument",
            name: name,
            // The default module, gets replaced by the loader
            // for all "neededTags"
            module: {parameter: {}}
        });
    } else if (syntax.type === "options") {
        Object.keys(syntax.options).forEach(function (tagName) {
            var option = syntax.options[tagName];
            translateParameter(
                option,
                template,
                name + ".children[" + JSON.stringify(tagName) + "]",
                option.as || tagName
            );
        });
    }
}
