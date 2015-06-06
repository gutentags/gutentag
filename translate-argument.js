"use strict";

var innerText = require("wizdom/inner-text");

module.exports = translateArgument;
function translateArgument(node, parameter, program, template, name, displayName) {
    program.add("node = {tagName: " + JSON.stringify(node.tagName.toLowerCase()) + "};\n");
    if (parameter.type === "entries") {
        program.add("node.children = {};\n");
        var child = node.firstChild;
        while (child) {
            if (child.nodeType === 1) {
                var argumentName = template.defineComponent(child, program, name, displayName);
                program.add("node.children[" + JSON.stringify(child.tagName.toLowerCase()) + "] = $" + argumentName + ";\n");
            }
            child = child.nextSibling;
        }
    } else if (parameter.type === "options") {
        program.add("node.children = {};\n");
        var child = node.firstChild;
        while (child) {
            if (child.nodeType === 1) {
                program.push();
                var childProgram = program.indent(child.tagName);
                var tagName = child.tagName.toLowerCase();
                var quotedTagName = JSON.stringify(tagName);
                var option = parameter.options[tagName];
                translateArgument(
                    child,
                    option,
                    childProgram,
                    template,
                    name,
                    displayName
                );
                if (option.plural) {
                    childProgram.add("parent.children[" + quotedTagName + "] = parent.children[" + quotedTagName + "] || [];\n");
                    childProgram.add("parent.children[" + quotedTagName + "].push(node);\n");
                } else {
                    childProgram.add("parent.children[" + quotedTagName + "] = node;\n");
                }
                program.pop();
            }
            child = child.nextSibling;
        }
    } else if (parameter.type === "text") {
        program.add("node.innerText = " + JSON.stringify(innerText(node)) + ";\n");
    } else if (parameter.type === "html") {
        program.add("node.innerHTML = " + JSON.stringify(node.innerHTML) + ";\n");
    } else { // if (parameter.type === "body") {
        var argumentName = template.defineComponent(node, program, name, displayName);
        program.add("node.component = $" + argumentName + ";\n");
    }
}
