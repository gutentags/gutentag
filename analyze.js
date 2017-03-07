"use strict";

var domenic = require("domenic");
var parser = new domenic.DOMParser();
var Program = require("./program");
var parseAccepts = require("./accepts-parser").parse;
var Scope = require("./scope");
var Template = require("./template");

module.exports = analyzeModule;
function analyzeModule(module) {
    var type;
    var trim = module.extension.length + 1;
    if (module.extension === "html") {
        type = "text/html";
    } else if (module.extension === "xml") {
        type = "application/xml";
    }

    var displayName = module.filename.slice(0, module.filename.length - trim).split(/[#\/]/g).map(function (part) {
        part = part.replace(/[^a-zA-Z0-9]/g, "");
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }).join("");
    if (!/[A-Z]/.test(displayName[0])) {
        displayName = "_" + displayName;
    }

    var document = parser.parseFromString(module.text, type);
    var program = new Program();
    var section = program.documentElement;
    var template = new Template();
    section.add('"use strict";\n');
    module.neededTags = {};
    var head = section.addSection("head");
    var tail = section.addSection("tail");
    analyzeDocument(document, head, tail, template, module);

    module.document = document;
    module.program = program;
    module.programHead = head;
    module.template = template;
    module.tagDisplayName = displayName;
};

// TODO We need to use this data, but whether space can be trimmed has less to
// do with the parent element and more to do with siblings.
// <div>  a: <span>x</span>,  <span>y</span>  </div>
//      ^^                   ^              ^^
// Custom tags need to be able to express whether and how internal and
// surrounding space should be handled.
// CSS lies.

function analyzeDocument(document, head, tail, template, module) {
    var child = document.documentElement.firstChild;
    while (child) {
        if (child.nodeType === 1 /* ELEMENT_NODE */) {
            var tagName = child.tagName.toLowerCase();
            if (tagName === "head") {
                analyzeHead(child, head, tail, template, module);
            } else if (tagName === "body") {
                analyzeElement(child, head, template, module);
            }
        }
        child = child.nextSibling;
    }
}

function analyzeHead(node, head, tail, template, module) {
    template.addTag("THIS", {type: "external", module: module, name: "THIS"});
    module.parameter = {};
    if (node) {
        var child = node.firstChild;
        while (child) {
            // TODO constants do not exist in minidom
            if (child.nodeType === 1 /* ELEMENT_NODE */) {
                var tagName = child.tagName.toLowerCase();
                if (tagName === "link") {
                    var rel = child.getAttribute("rel");
                    var href = child.getAttribute("href");
                    if (rel === "extends") {
                        head.add("var $SUPER = require" + "(" + JSON.stringify(href) + ");\n");
                        module.dependencies.push(href);
                        template.extends = true;
                        template.addTag("SUPER", {type: "super", name: "SUPER"});
                    } else if (rel === "exports") {
                        module.dependencies.push(href);
                        template.exports = href;
                    } else if (rel === "tag") {
                        module.dependencies.push(href);
                        var as = getAs(child);
                        var name = as.replace(/[^A-Za-z0-9_]/g, "_");
                        // TODO validate identifier
                        tail.add("var $" + name + " = require" + "(" + JSON.stringify(href) + ");\n");
                        module.neededTags[as] = href;
                        template.addTag(as, {type: "external", id: href, name: name});
                    } else if (rel === "attribute") {
                        module.dependencies.push(href);
                        var as = getAs(child);
                        var name = as.replace(/[^A-Za-z0-9_]/g, "_");
                        // TODO validate identifier
                        tail.add("var $$" + name + " = require" + "(" + JSON.stringify(href) + ");\n");
                        template.addAttribute(as, name);
                    }
                    // ...
                } else if (tagName === "meta") {
                    if (child.getAttribute("accepts")) {
                        var accepts = child.getAttribute("accepts");
                        var syntax = parseAccepts(accepts);
                        module.parameter = syntax;
                        analyzeAccepts(
                            syntax,
                            template,
                            "callee.argument",
                            child.getAttribute("as") || "argument"
                        );
                    } else if (child.getAttribute("exports")) {
                        var name = child.getAttribute("exports");
                        var as = child.getAttribute("as");
                        template.exportNames[name] = as;
                    }
                    // ...
                }
            }
            child = child.nextSibling;
        }
    }
}

function analyzeElement(element, program, template, module) {
    var child = element.firstChild;
    while (child) {
        if (child.nodeType === 1 /* ELEMENT_NODE */) {
            var href = element.getAttribute("href");
            if (href != null && href !== "") {
                module.dependencies.push(href);
            }
            // TODO src for resources
            analyzeElement(child, program, template, module);
        }
        child = child.nextSibling;
    }
}

function analyzeAccepts(syntax, template, name, as) {
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
            analyzeAccepts(
                option,
                template,
                name + ".children[" + JSON.stringify(tagName) + "]",
                option.as || tagName
            );
        });
    }
}

function getAs(node) {
    var href = node.getAttribute("href");
    var as = node.getAttribute("as");
    if (!as) {
        var match = /([^\/]+)$/.exec(href);
        as = match[1];
        as = as.replace(/(?:\.html|\.xml)$/, "");
    }
    return as.toUpperCase();
}
