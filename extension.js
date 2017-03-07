'use strict';

// The Gutentag HTML/XML extension works in two passes: analyze and translate
// (synthesize).
//
// The analysis phase occurs during module loading, producing the DOM for the
// component and then walking it to find shallow dependencies.
// The module system uses the dependency graph to load all of the modules,
// including components, building the transitive working set before translating
// any of them.
// The analysis pass also establishes the calling convention for the tag: what
// each component accepts as an argument, how to translate the body of a
// component tag into an argument component or tree of components.
// Analyzing the calling convention during analysis ensures that every
// component can synthesize an argument shape from the DOM in a calling
// component, regardless of the order they are synthesized.
//
// The synthesis phase occurs during module translation, walking the DOM,
// particularly the body, producing JavaScript code from each tag.
// When the translator expands the DOM for a component tag, it looks up the
// calling convention for that tag and produces an argument object in the
// shape the called component expects, like a [body], [entries], [text], or
// [html]. Arguments consist of one or more anonymous components that can
// instantiate fragments in another component, but in the scope of the caller
// component.

exports.analyze = require('./analyze');
exports.translate = require('./translate');
