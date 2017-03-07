"use strict";

var domenic = require("domenic");
var parser = new domenic.DOMParser();
var Scope = require("./scope");
var innerText = require("wizdom/inner-text");

// call graph:
// - translateModule
//   - <html> translateDocument
//     - <body> tranlsateBody
//       - translateComponentBody (or recurse from argument)
//         - translateFragment (or recurse from element)
//           - translateElement
//             - translateFragment (recurse)
//             - translateAttributes
//             - translateComponent
//               - translateArgument (or recurse from translateArgumentOption)
//                 - translateArgumentOption
//                   - translateArgument (recurse)
//                 - translateArgumentBody
//                   - translateComponentBody (recurse)

module.exports = translateModule;
function translateModule(module) {
    // Cross-reference needed tags on template
    var tagNames = Object.keys(module.neededTags);
    for (var i = 0; i < tagNames.length; i++) {
        var tagName = tagNames[i];
        var href = module.neededTags[tagName];
        module.template.getTag(tagName).module = module.system.lookup(href, module.id);
    }

    translateDocument(
        module.document,
        module.programHead,
        module.template,
        module,
        "THIS",
        module.tagDisplayName
    );

    module.text = module.program.digest();
    module.extension = "js";
}

// Visits the <html> tag of a component.
// Generates either an alias component (if <link rel="exports">),
// or a constructor component, using the <body>.
//
// A <link rel="exports"> component has a pure JavaScript implementation.
// The HTML module serves only to determine the calling convention, using
// <meta accepts>.
//
// calls:
// - tranlsateBody
// called by:
// - translateModule
function translateDocument(document, program, template, module, name, displayName) {
    if (template.exports) {
        program.add("module.exports = (require)(" + JSON.stringify(template.exports) + ");\n");
    } else {
        program.add("module.exports = " + displayName + ";\n");
        var child = document.documentElement.firstChild;
        while (child) {
            if (child.nodeType === 1 /* ELEMENT_NODE */) {
                if (child.tagName.toLowerCase() === "body") {
                    translateBody(
                        child,
                        program.addSection("element"),
                        template,
                        name,
                        displayName
                    );
                }
            }
            child = child.nextSibling;
        }
    }
}

// Visits the <body> tag of a component.
// Generates the trappings around the component constructor,
// including its prototype and parent prototype if specified with <link
// rel="extends".
// Generates the boilerplate to establish the document and root lexical scope
// for instances of the component.
// Uses translateComponentBody to translate the children of the body.
//
// calls:
// - translateComponentBody
// called by:
// - translateDocument
function translateBody(body, program, template, name, displayName) {
    program.add("function " + displayName + "(body, caller) {\n");
    var bodyProgram = program.indent();
    program.add("}\n");
    program.add("var $THIS = " + displayName + "\n");

    // Trailing inheritance declarations
    if (template.extends) {
        program.add("$THIS.prototype = Object.create($SUPER.prototype);\n");
        program.add("$THIS.prototype.constructor = $THIS;\n");
    }
    program.add("$THIS.prototype.exports = " + JSON.stringify(template.exportNames) + ";\n");

    // Call super constructor
    if (template.extends) {
        bodyProgram.add("$SUPER.apply(this, arguments);\n");
    }

    // Establish the component and its scope
    bodyProgram.add("var document = body.ownerDocument;\n");
    bodyProgram.add("var scope = this.scope = caller.root.nestComponents();\n");
    // caller is the argument scope
    // caller.argument is the argument template(s)
    bodyProgram.add("scope.caller = caller;\n");
    bodyProgram.add("scope.this = this;\n");

    var root = new Scope();
    var scope = root.nest();
    scope.significantSpace = false;
    scope.namespace = null;

    // Build out the body
    translateComponentBody(
        body,
        bodyProgram.addSection("segment"),
        scope,
        template,
        name,
        displayName
    );

    // Note "this" in scope.
    // This is a good hook for final wiring.
    bodyProgram.add("this.scope.hookup(\"this\", this);\n");
}

// Generates the body of a component constructor function, for both
// the exported component function, and the component functions for any arguments
// passed by the component.
//
// calls:
// - translateFragment
// called by:
// - translateBody
// - translateArgumentBody
function translateComponentBody(node, program, scope, template, name, displayName) {
    var header = program.add("var parent = body, parents = [], node, component, callee, argument;\n");
    var unused = translateFragment(
        node,
        program.addSection("fragment"),
        scope,
        template,
        name,
        displayName
    );
    if (unused) {
        program.removeChild(header);
    }
}

// translateFragment visits the children of a component DOM fragment and
// generates the JavaScript that will build a DOM using either elements or text
// nodes.
// translateFragment delegates to translateElement to either interpret DOM
// elements literally or as linked components (<link rel="tag">).
// Returns whether the fragment generated any code, so the caller can elide the
// fragment and its wrapping entirely.
//
// The <body> of a component constructor contains a fragment, as well as every
// argument body and and every literal element contains a fragment.
//
// calls:
// - translateElement
// called by:
// - translateComponentBody
// - translateElement (inside or outside of an <sp> tag)
function translateFragment(node, program, scope, template, name, displayName) {
    var child = node.firstChild;
    var text;
    var unused = true;
    while (child) {
        if (child.nodeType === 1 /*domenic.Element.ELEMENT_NODE*/) {
            translateElement(
                child,
                program.addSection("element"),
                scope,
                template,
                name,
                displayName
            );
            unused = false;
        } else if (child.nodeType === 3 /*domenic.Element.TEXT_NODE*/) {
            text = child.nodeValue;
            if (scope.significantSpace) {
                text = text.replace(/[\s\n]+/g, " ");
            } else {
                text = text.trim();
            }
            if (text) {
                program.add("parent.appendChild(document.createTextNode(" + JSON.stringify(text) + "));\n");
                unused = false;
            }
        }
        child = child.nextSibling;
    }
    return unused;
}

// translateElement takes a component DOM element and translates it into
// the equivalent JavaScript function that would emit that element, or
// instantiate a linked component in its place.
//
// calls:
// - translateFragment
// - translateArgument
// called by:
// - translateFragment
function translateElement(node, program, caller, template, name, displayName) {
    var id = node.getAttribute("id");
    var tagName = node.tagName.toUpperCase();
    var argumentTag = template.getTag(tagName);

    program.add("// " + tagName + " " + id + "\n");

    var callee = caller.nest();
    callee.namespace = node.getAttribute("xmlns") || caller.namespace;

    if (tagName === "SP") {
        callee.significantSpace = true;
        return translateFragment(
            node,
            program.addSection("fragment"),
            callee,
            template,
            name,
            displayName
        );
    }

    if (argumentTag) {
        program.add("node = document.createBody();\n");
    } else if (callee.namespace) {
        program.add("node = document.createElementNS(" +
            JSON.stringify(callee.namespace) + ", " +
            JSON.stringify(node.tagName) + ");\n"
        );
    } else {
        program.add("node = document.createElement(" + JSON.stringify(node.tagName) + ");\n");
    }

    program.add("parent.appendChild(node);\n");

    var component;
    if (argumentTag && argumentTag.module.parameter) {
        translateComponent(
            node,
            argumentTag,
            argumentTag.module.parameter,
            program,
            callee,
            template,
            name,
            displayName
        );
    } else {
        program.add("component = node.actualNode;\n");
    }

    translateAttributes(node, id, template, program);

    // Introduce new component or node to its owner.
    if (id) {
        program.add("scope.hookup(" + JSON.stringify(id) + ", component);\n");
    }

    program.add("// /" + tagName + " " + id + "\n");

    if (!argumentTag) {
        program.push();
        translateFragment(
            node,
            program.indent(node.tagName),
            callee,
            template,
            name,
            displayName
        );
        program.pop();
    }
}

// translateAttributes takes DOM attributes and generates the corresponding
// JavaScript setAttribute calls, as well as linkage for the special "id" and
// "for" attributes.
//
// "id" attributes from the component DOM are translated to unique ID
// attributes for the instantiated DOM. These identifiers apply to both
// elements and components.
//
// "for" attributes are references to the identifier of another instance
// in scope. For example <label for="foo"> will link to <input id="foo">.
// To preserve this behavior for idiomatic HTML, this function translates the
// "for" identifier to the unique identifier of the corresponding component in
// scope.
//
// Regardless, the linkage between elements and components both use
// the "setAttribute" method, if present, so a component can override the
// behavior for any attribute.
//
// called by:
// -  translateElement
function translateAttributes(node, id, template, program) {
    for (var attribute, key, value, index = 0, attributes = node.attributes, length = attributes.length; index < length; index++) {
        attribute = attributes.item(index);
        key = attribute.nodeName;
        value = attribute.value || node.nodeValue;
        if (template.hasAttribute(key.toUpperCase())) {
            var attributeName = template.getAttribute(key.toUpperCase());
            program.add("$$" + attributeName + "(component, " + JSON.stringify(key) + ", " + JSON.stringify(value) + ", scope);\n");
        } else if (key === "id") {
            var uid = id + "_" + ((0x7FFFFFFF * Math.random()) | 0).toString(36);
            program.add("if (component.setAttribute) {\n");
            program.add("    component.setAttribute(\"id\", " + JSON.stringify(uid) + ");\n");
            program.add("}\n");
            // If a label precedes the element it refers to
            program.add("if (scope.componentsFor[" + JSON.stringify(value) + "]) {\n");
            program.add("    scope.componentsFor[" + JSON.stringify(value) + "].setAttribute(\"for\", " + JSON.stringify(uid) + ")\n");
            program.add("}\n");
        } else if (key === "for") {
            // When the identified component will be declared after the label
            program.add("scope.componentsFor[" + JSON.stringify(value) + "] = node;\n");
            // When the identified component was declared before the label
            program.add("if (component.setAttribute && scope.components[" + JSON.stringify(value) + "]) {\n");
            program.add("    component.setAttribute(\"for\", scope.components[" + JSON.stringify(value) + "].getAttribute(\"id\"));\n");
            program.add("}\n");
        } else {
            program.add("if (component.setAttribute) {\n");
            program.add("    component.setAttribute(" + JSON.stringify(key) + ", " + JSON.stringify(value) + ");\n");
            program.add("}\n");
        }
    }
}

// translateComponent transforms the DOM body of an linked component into the
// argument object that the linked component accepts.
// This involves negotiating between the DOM body provided by the caller and
// the formal parameters of the callee component's <meta accepts> clause.
//
// translateComponent delegates to the recursive translateArgument
// for the heavy lifting, and generates the additional JavaScript for the calling
// component to kick off the calling convention.
//
// Components can either be internal or external, with slightly different
// generated code. External components come from a <link rel="tag">.
// Internal components come from arguments <meta accepts>, or the special
// <this> or <super> tags.
//
// called by:
// - translateElement
// calls:
// - translateArgument
function translateComponent(node, argument, parameter, program, scope, template, name, displayName) {
    program.push();
    var argumentProgram = program.indent(node.tagName);
    program.pop();
    program = argumentProgram;

    translateArgument(node, parameter, program, scope, template, name, displayName);

    // Pass the scope back to the caller.
    var name;
    var id = node.getAttribute("id");
    if (argument.type === "argument") {
        name = argument.name + ".component";
        program.add("callee = scope.caller.nest();\n");
        program.add("if (" + argument.name + ") {\n");
        program.add("    callee.id = " + JSON.stringify(id) + ";\n");
        program.add("    component = new " + name + "(parent, callee);\n");
        // Default template fallback if optional component not provided.
        program.add("} else {\n");
        program.add("    component = new node.component(parent, scope);\n");
        program.add("}\n");
        // Instantiate an argument from the template that instantiated this.
    } else if (argument.type === "external") {
        // Pass a chunk of our own template to an external component.
        program.add("callee = scope.nest();\n");
        program.add("callee.argument = node;\n");
        name = "$" + argument.name;
        program.add("callee.id = " + JSON.stringify(id) + ";\n");
        program.add("component = new " + name + "(parent, callee);\n");
    }

}

// translateArgument negotiates the formal parameters of the called component
// with the passed argument of the callee component, generating the data
// structure that the callee requests with the DOM fragment the caller
// provides.
//
// calls:
// - translateArgumentBody (for both body and entries variants)
// - translateArgumentOption (which recurses)
// called by:
// - translateComponent
function translateArgument(node, parameter, program, scope, template, name, displayName) {
    program.add("node = {tagName: " + JSON.stringify(node.tagName.toLowerCase()) + "};\n");
    // accepts="x y z"
    if (parameter.type === "options") {
        program.add("node.children = {};\n");
        var child = node.firstChild;
        while (child) {
            if (child.nodeType === 1) {
                translateArgumentOption(child, parameter, program, scope, template, name, displayName);
            }
            child = child.nextSibling;
        }
    // accepts="[entries]"
    } else if (parameter.type === "entries") {
        program.add("node.children = {};\n");
        var child = node.firstChild;
        while (child) {
            if (child.nodeType === 1) {
                var argumentName = translateArgumentBody(template, child, program, scope, name, displayName);
                program.add("node.children[" + JSON.stringify(child.tagName.toLowerCase()) + "] = $" + argumentName + ";\n");
            }
            child = child.nextSibling;
        }
    // accepts="[text]"
    } else if (parameter.type === "text") {
        program.add("node.innerText = " + JSON.stringify(innerText(node)) + ";\n");
    // accepts="[html]"
    } else if (parameter.type === "html") {
        program.add("node.innerHTML = " + JSON.stringify(node.innerHTML) + ";\n");
    // accepts="[body]"
    } else { // if (parameter.type === "body") { // or may be undefined
        var argumentName = translateArgumentBody(template, node, program, scope, name, displayName);
        program.add("node.component = $" + argumentName + ";\n");
    }
}

// tranlsateArgumentOption builds out an object with all the optional tags provided in the caller DOM.
// The shape of each option gets populated recursively by calling back up to translateArgument.
// In practice, options are shallow and each option is equivalent to a named <meta accepts=[body]>.
//
// calls:
// - translateArgument (recursive)
// called by:
// - translateArgument
//   - for each body in [options]
function translateArgumentOption(child, parameter, program, scope, template, name, displayName) {
    program.push();
    var childProgram = program.indent(child.tagName);
    var tagName = child.tagName.toLowerCase();
    var quotedTagName = JSON.stringify(tagName);
    var option = parameter.options[tagName];
    translateArgument(
        child,
        option,
        childProgram,
        scope,
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

// translateArgumentBody creates a component constructor function for the body
// of a parameter.
//
// translateArgumentBody creates all the outer boilerplate for a component
// constructor function and delegates recursively to translateComponentBody
// to fill in the details for the argument component DOM fragment.
//
// called by:
// - translateArgument
//   - for [body]
//   - for each body in [entries]
// calls:
// - translateComponentBody (recurse)
function translateArgumentBody(template, node, program, scope, name, displayName) {
    var suffix = template.nextArgumentSuffix();

    program = program.ownerDocument.documentElement.addSection("argument");
    name = name + suffix;
    displayName = displayName + suffix;

    program.add("var $" + name + " = function " + displayName + "(body, caller) {\n");
    var argumentProgram = program.indent();
    argumentProgram.add("var document = body.ownerDocument;\n");
    argumentProgram.add("var scope = this.scope = caller;\n");
    translateComponentBody(
        node,
        argumentProgram.addSection("segment"),
        scope,
        template,
        name,
        displayName
    );
    program.add("};\n");

    return name;
}
