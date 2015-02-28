
Guten Tag!
===========

This package provides building blocks for creating and using HTML tags for
modules written in HTML.
Bring your own bindings, shims, data, animation, or virtual document if you need
one.
The "Guten Tag, Welt!" application is about 15K and 3K after uglify and gzip.
These are not yesterday's web components.

A tag is defined in HTML and can import tags from other HTML modules.
This `list.html` tag produces a list at whatever point in a document you
incorporate it.

```html
<!doctype html>
<html>
    <head>
        <link rel="extends" href="./list">
        <link rel="tag" href="gutentag/repeat.html">
        <link rel="tag" href="gutentag/text.html">
    </head>
    <body>
        <ul><repeat id="items">
            <li id="item" type="a"><text id="text"></text></li>
        </repeat></ul>
    </body>
</html>
```

A JavaScript module, `list.js`, connects the tags inside the list. The HTML
module exports a constructor for the module and calls into the `add` method
of the underlying JavaScript implementation, if it exists.

```js
'use strict';
module.exports = List;
function List() {}
List.prototype.add = function (child, id, scope) {
    if (id === "items") {
        this.items = child;
    } else if (id === "text") {
        var iteration = scope.itemsIteration;
        child.value = iteration.value;
    }
};
```

Trivial tags can live without an underlying JavaScript implementation. Instead
of calling `add`, they just use the identifier of each tag to define a
property of the tag instance.

Although tags can manage their children, the first tag on a page has to be
added to the document manually.
To do so requires some minimal understanding of the tag calling convention.

A tag module exports a constructor.
The constructor accepts a `body`, `scope`, and an optional `argument`.

The `body` is a special kind of node in a virtual document.
It represents a point in the actual document that the given tag will control.
Bodies can be added and removed from the virtual document, and all of their
content will be added or removed from the actual document.
However, bodies do not introduce a container element, like a `<div>`.
This is critical for all of the building blocks that Gutentag provides since
there are cases where you would want more than one of these inline.
In other cases where having a wrapper element would interfere with CSS
selectors, particularly for the flex model.

The `scope` is an object that captures components along its prototype chain.
The root scope has a `root` property that refers to itself, so `scope.root` will
always give you this empty scope object.
Every scope has a `nest()` method that returns an object that inherits
prototypically from its creator.
Tag components use `scope.root.nest()` to create a new lexical environment such
that `scope.this` refers to the component.
The repeat tag uses `scope.nest()` to create new scopes for each iteration.

Components create a body with `body.ownerDocument.createBody()`, add that
body to their own document, and pass it as the first argument of a child
component constructor.
They pass their own scope as the second argument.
Depending on how the child component accepts arguments, it will construct an
appropriate `argument` object from the document between their start and end tag,
and pass that as the third argument.

The first component on the page does not accept an argument, so you just create
a body and a scope.

```js
var Document = require("gutentag/dom-body");
var Scope = require("gutentag/scope");
var List = require("./list.html");

var scope = new Scope();
var document = new Document(window.document.body);
var list = new List(document.documentElement, scope);
list.items.value = ['Guten', 'Tag,', 'Welt!'];
```

Tags require a module system that can load these HTML modules.
Version 2 of [Mr][] supports to-JavaScript translator modules and enables
dependencies to inherit these translators.

```
npm install mr@2 --save-dev
```

[Mr]: https://github.com/kriskowal/mr

The gutentags package.json exports translators for "html" and "xml" and any
package that depends on gutentags inherits these.

```json
{
  "translators": {
    "html": "./translate-html",
    "xml": "./translate-xml"
  }
}
```

Importantly, the module loader allows tags to inspect the headers of the tags
they depend upon, particularly to figure out what kind of argument they accept.

During development, Mr supports loading modules installed by npm without a build
step, provided that the packages are compatible (no support for directories with
an implicit `index.js`) and that the modules have not been deduped (with `npm
dedupe`).

```html
<!doctype html>
<html>
    <head>
        <script src="node_modules/mr/boot.js" data-module="index">
        </script>
    </head>
    <body>
    </body>
</html>
```

To bundle up your modules for production, Mr also provides a tool called Mrs,
that operates like Browserify and generates a bundle.
Mrs translates all of the HTML modules into JavaScript and bundles a very
minimal module system.
You can add a build step to your package.json.

```
{
  "scripts": {
    "build": "mrs index.js | uglifyjs > bundle.js"
  }
}
```

## Tags

The gutentags project provides the following building block tags, all of which
have very simple implementations that you can copy and modify for your needs.
They all have a mutable `value` property.

- `text.html` controls inline text
- `html.html` controls an inline block of HTML
- `repeat.html` repeats its argument
- `reveal.html` shows or hides its argument
- `switch.html` shows one of its argument tags

### text.html

A text tag controls a text node based on its `value` property.
The default text, if its value property is `null` or `undefined`, is the
innerText of the argument.

```html
<!doctype html>
<html>
    <head>
        <link rel="tag" href="gutentag/text.html">
    </head>
    <body>
        <text id="description">Beschreibung bevorstehende.</text>
    </body>
</html>
```

```js
text.value = "Guten Tag, Welt!";
```

Take a peek at essays/text.

### html.html

An HTML tag controls the HTML that appears at its position based on its `value`
property.
Like a text tag, the HTML tag does not introduce a wrapper element.
Note that `html` is a special tag in the HTML5 vocabulary, so this tag has to be
linked by an alternate tag name or used in XML.

```html
<!doctype html>
<html>
    <head>
        <link rel="tag" href="gutentag/html.html" as="x-html">
    </head>
    <body>
        <x-html id="description"></x-html>
    </body>
</html>
```

```js
html.value = "<b>Bold <i>and</b> italic</b></i>";
```

Take a peek at essays/html.

### repeat.html

Repeats its content based on the values in the given `value` array.

```html
<!doctype html>
<html>
    <head>
        <link rel="extends" href="./list">
        <link rel="tag" href="gutentag/repeat.html">
        <link rel="tag" href="gutentag/text.html">
    </head>
    <body>
        <ul><repeat id="items">
            <li id="item" type="a"><text id="text"></text></li>
        </repeat></ul>
    </body>
</html>
```

The repetition creates a scope for each of its iterations.
In that scope, the iteration object is accessible by a name constructed from the
id of the iteration, plus "Iteration".
The iteration object has an `index` and a `value` property.

```js
'use strict';
module.exports = List;
function List() {}
List.prototype.add = function (child, id, scope) {
    if (id === "text") {
        var iteration = scope.itemsIteration;
        child.value = iteration.value;
    }
};
```

The repetition creates new iterations on demand and reacts to changes to the
given values array.

Take a peek at essays/repeat.

### reveal.html

Reveals its content based on whether `value` is truthy.

```html
<!doctype html>
<html>
    <head>
        <link rel="extends" href="./blink">
        <link rel="tag" href="gutentag/reveal.html">
        <meta accepts=".component">
    </head>
    <body>
        <reveal id="content"><argument></argument></reveal>
    </body>
</html>
```html

```js
'use strict';
module.exports = Blink;
function Blink() {}
Blink.prototype.add = function (child, id) {
    if (id === "content") {
        setInterval(function () {
            child.value = !child.value;
        }, 1000);
    }
}
```

Take a peek at essay/reveal.

### choose.html

Reveals one of its options, as expressed by named child tags, based on its
`value`.
Constructs the children on demand.

```html
<!doctype html>
<html>
    <head>
        <link rel="extends" href="./essay">
        <link rel="tag" href="../../choose.html">
        <link rel="tag" href="../../repeat.html">
        <link rel="tag" href="../../text.html">
    </head>
    <body>
        <repeat id="buttons">
            <button id="button">
                <text id="buttonLabel">—</text>
            </button>
        </repeat>
        <choose id="choose">
            <a>Police</a>
            <b>Officer</b>
            <c>Wolves</c>
            <d>Old Witch</d>
            <e>Going to Sleep</e>
        </choose>
    </body>
</html>
```

```js
choose.value = "e";
```

Take a peek at essays/choose.

## Custom tags

The gutentags project provides only the minimum building blocks to get your
project started, and establishes a convention for packaging your own tags.

If your package defines a single tag like `autocomplete.html`, name your package
`autocomplete.html` and define your main module as `index.html`.

```json
{
    "name": "autocomplete.html",
    "description": "An autocomplete guten tag",
    "version": "1.0.0",
    "main": "./index.html"
}
```

### Argument

Invoking a tag in another tag may use the content between the start and end tag
in various ways to pass an argument into the called tag.
Tags must express how they receive their argument.
Note that the following API is subject to radical change before version 1.

-   ``<meta accepts=".component">`` receive the entire argument as a component.
    The argument is instantiable in HTML tag definitions as the ``<argument>``
    tag.
-   ``<meta accepts=".component*">`` receive each of the child nodes as a named
    argument component. The component constructor will receive an object with
    named properties for each component.
-   ``<meta accepts=".innerText">`` receives the entire argument as a string
    from its `innerText`.
-   ``<meta accepts=".innerHTML">`` receives the entire argument as a string
    from its `innerHTML`.

For example, this tag parenthesizes its argument.

```html
<!doctype html>
<html>
    <head>
        <meta accepts=".component">
    </head>
    <body>(<argument></argument>)</body>
</html>
```

### This

Components support self recursion. This is useful for creating trees.
The ``<this></this>`` tag stands for this component.

```html
<!doctype html>
<html>
    <head>
        <link rel="extends" href="./tree">
        <link rel="tag" href="../../text.html">
        <link rel="tag" href="../../repeat.html">
        <meta accepts=".component">
    </head>
    <body>
        <argument></argument>
        <ul>
            <repeat id="children">
                <li><this id="child"><argument></argument></this></li>
            </repeat>
        </ul>
    </body>
</html>
```

### XML

Gutentag supports XML for cases where the HTML5 parser gets in your way.
For example, the HTML5 parser does not allow a ``<repeat>`` tag to exist within
a ``<table>``. XML does.

```xml
<html>
    <head>
        <link rel="extends" href="./grid"/>
        <link rel="tag" href="gutentag/repeat.html"/>
        <link rel="tag" href="gutentag/text.html"/>
    </head>
    <body>
        <table>
            <thead>
                <tr id="columnRow">
                    <th></th>
                    <repeat id="columns">
                        <th><text id="ch"/></th>
                    </repeat>
                </tr>
            </thead>
            <tbody>
                <repeat id="rows">
                    <th><text id="rh"/></th>
                    <repeat id="cells">
                        <td><text id="cd"/></td>
                    </repeat>
                </repeat>
            </tbody>
        </table>
    </body>
</html>
```

### Virtual Document

Every node of the virtual document has an `actualNode` and proxies common DOM
methods and properties including `innerHTML`, `innerText`, `getAttribute`,
`setAttribute`, `hasAttribute`, and `removeAttribute`, but does not emulate
anything fancy.
Just use `actualNode`

## License and Copyright

Copyright (c) 2015 by Kristopher Michael Kowal and contributors.
MIT License.

