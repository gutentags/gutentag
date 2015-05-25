
Guten Tag!
===========

A guten tag is an HTML or XML file that defines a template for instantiating a
combination of JavaScript components and DOM elements.
Guten tags export a component constructor and can import other component
constructors, binding them to tag names in the scope of a document.
The markup translates to JavaScript, on-the-fly in the browser during
development, or in Node.js as a build step.
In this examle, we import the `<repeat>` and `<text>` tags from guten tag
modules.

```html
<head>
    <link rel="extends" href="./list">
    <link rel="tag" href="gutentag/repeat.html">
    <link rel="tag" href="gutentag/text.html">
</head>
```

Guten tags have a lexical scope for component and element identifiers, and can
introduce components into caller scopes under the identifier of the caller.
In this example, there is a repetition with an id of "items" that introduces
"items:iteration" in the iteration scopes from the body of the repetition.

```html
<ul><repeat id="items">
    <li id="item" type="a"><text id="text"></text></li>
</repeat></ul>
```

Guten tag only provides the `<text>`, `<html>`, `<repeat>`, `<reveal>`, and
`<choose>` tags and the system for loading tags.
Bring your own bindings, shims, data, animation, or virtual document if you need
them.
The "Guten Tag, Welt!" application is about 15K and 3K after uglify and gzip.

A tag is defined in HTML or XML and can import tags from other HTML modules.
This `list.html` tag produces a list at whatever point in a document you
incorporate it.
An instance of a tag is a component.

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

A JavaScript module, `list.js`, connects the components of the list.
The HTML module exports a constructor for the module and calls into the `add`
method of the underlying JavaScript implementation, if it exists.

```js
'use strict';
module.exports = List;
function List() {}
List.prototype.add = function (child, id, scope) {
    if (id === "items:iteration") {
        scope.text.value = child.value;
    } else if (id === "this") {
        this.items = scope.items;
    }
};
```

Trivial tags can live without an underlying JavaScript implementation.

Tags modules compile to JavaScript that export a component constructor..
The constructor accepts a `body` and a `caller` scope.

```
"use strict";
module.exports = Component;
function Component(body, caller) {
    this.scope = caller.root.nestComponents();
    body.appendChild(document.createTextNode("Guten Tag, Welt!\n"));
}
```

The `body` is a special kind of node in a virtual document.
It represents a point in the actual document that the given tag will control.
Bodies can be added and removed from the virtual document, and all of their
content will be (synchronously) added or removed from the actual document.
However, bodies do not introduce a container element, like a `<div>`.
This is critical for the Gutenttag structural tags, `<repeat>`, `<reveal>`, and
`<choose>`, since you may or may not need a container element around them or
inside them, and you may want one or more of these inline.

```html
<table>
    <tr>
        <th><!-- corner --></th>
        <th id="groupOneHeader" colspan=""></th>
        <th id="groupTwoHeader" colspan=""></th>
    </tr>
    <tr>
        <th><text id="rowHeader"></text></th>
        <repeat id="groupOne">
            <td><text id="cell"></text></td>
        </repeat>
        <repeat id="groupTwo">
            <td><text id="cell"></text></td>
        </repeat>
    </tr>
</table>
```

In other cases, having a wrapper element would interfere with CSS selectors,
particularly for the flex model, or would interfere with semantic markup.

```html
<repeat id="stanzas"><p class="stanza">
    <repeat id="lines">
        <text id="line"></text>
        <reveal id="medial"><br></reveal>
    </repeat>
</p></repeat>
```

Sometimes it is useful to compose text without container elements at all.

```html
<sp><text id="hello">, <text id="person">!</sp>
```

The `caller` object is a scope container that inherits properties along its
prototype chain up to the root scope.
This makes the root scope object an ideal container for dependency injection.
The `scope.root` refers to that root scope from any descendant scope.
Each scope also has a direct reference to its `scope.parent`.

In a component, `scope.this` will always refer to the component instantiated by
containing tag document.
So, in `foo.html`, `scope.this` is the containing instance of the `Foo`
component.
The `scope.components` object maps component identifiers in that scope to their
corresponding component instance.

Every subcomponent has a scope, but many scopes share the same
`scope.components`.
The body of an HTML tag is the root of a lexical scope and introduces an empty
`scope.components` object to which each child component adds itslef.
In this example, the `scope.components` object will have `hello` and `person`
components.
Note that Gutentags trim implied white space between tags and the `<sp>` special
tag notes explicit template text.

```html
<!doctype html>
<html>
    <head>
        <link rel="tag" href="gutentag/text.html">
    </head>
    <body>
        <text id="hello"></text><sp>, </sp>
        <text id="person">!
    </body>
</html>
```

The Gutentag building blocks, `<repeat>`, `<reveal>`, and `<choose>` create
child scopes that introduce a new `scope.components` object that inherits
prototypically from the containing scope's components,
`scope.parent.components`.
In this example, the "hello" and "person" components are each within a
"greetings:iteration" component and have access to `scope.components.header`,
but from the perspective of the "header", it is in a scope by itself.

```html
<!doctype html>
<html>
    <head>
        <link rel="tag" href="gutentag/text.html">
        <link rel="tag" href="gutentag/repeat.html">
    </head>
    <body>
        <h1><text id="header"></h1>
        <repeat id="greetings">
            <text id="hello"></text><sp>, </sp>
            <text id="person">!
        </repeat>
    </body>
</html>
```

Each scope may also have a `scope.caller` property, referring to the lexical
scope of the tag that instantiated this component, and a `scope.argument`
referring to a template for the content of the instantiating tag.

Instantiating a tag from within a tag also passes its inner content as a
template in the form requested by that tag through its `<meta accepts>` header.
For example, `text.html` has `<meta accepts="[text]">`, `repeat.html` has `<meta
accepts="[body]">`, and `choose.html` has `<meta accepts="[entries]">`.
Each of these packs the content into `caller.argument` in the fashion expected
by the component.

## Bootstrapping

Every Gutentag application starts with an npm package.
You will need a `package.json`.
Use `npm init` to create one.

You will also need copies of the module system and Gutentag installed locally.
Tags require a module system that can load these HTML modules.
The [System][] loader supports to-JavaScript translator modules.
During development, System supports loading modules installed by npm without a
build step, provided that the packages are compatible (no support for
directories with an implicit `index.js`) and that the modules have not been
deduped (with `npm dedupe`).

[System]: https://github.com/gutentags/system

```
$ npm init
$ npm install --save system
$ npm install --save koerper
$ npm install --save gutentag
```

To enable Mr to load Gutentag HTML or XML files, add a "translators" annotation
to `package.json`.

```json
{
  "translators": {
    "html": "gutentag/translate-html",
    "xml": "gutentag/translate-xml"
  }
}
```

A Gutentag application starts with a boilerplate `index.html`.
This HTML is suitable for debugging locally with your favorite web server.
Refreshing the page reloads all modules without incurring a build step.
You have the option of using this page as a loading screen if your application
takes a significant amount of time to load.
It also would host all of your metadata and assets like icons and CSS themes.

```html
<!doctype html>
<html>
    <head>
    </head>
    <body>
        <script src="node_modules/system/boot.js" data-import="./index"></script>
    </body>
</html>
```

The HTML calls into the Mr bootstrapping script which in turn loads the entry
module, `index.js`.
This boilerplate module just creates a virtual document, a root scope, and the
root component.

```js
var Document = require("koerper");
var Scope = require("gutentag/scope");
var App = require("app.html");

var scope = new Scope();
var document = new Document(window.document.body);
var app = new App(document.documentElement, scope);
```

To bundle up your modules for production, System also provides a tool called
Bundle, that operates like Browserify and generates a bundle.
Bundle translates all of the HTML modules into JavaScript and bundles a very
minimal module system.
You can add a build step to your package.json and run it with `npm run build`.

```
{
  "scripts": {
    "build": "bundle index.js | uglifyjs > bundle.js"
  }
}
```

For my debut Gutentag application, there is a [build script][BuildTengwar]
that rolls up the bundled HTML and CSS directly to a `gh-pages` branch, suitable
for pushing to Github.

[BuildTengwar]: https://github.com/gutentags/tengwar.html/blob/master/build-gh-pages.sh


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
id of the iteration, plus ":iteration".
The iteration object has an `index` and a `value` property.

```js
'use strict';
module.exports = List;
function List() {}
List.prototype.add = function (component, id, scope) {
    var components = scope.components;
    if (id === "items:iteration") {
        components.text.value = component.value;
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
        <meta accepts="[body]">
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
Blink.prototype.add = function (component, id) {
    if (id === "content") {
        setInterval(function () {
            component.value = !component.value;
        }, 1000);
    }
}
```

A `<reveal id="content">` tag instantiates its inner content in a
`content:revelation` scope each time it reveals that content.

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
        <choose id="options">
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

A `<choose id="options">` tag instantiates one of its choices in a fresh scope
each time its value changes.
The name of that scope comes from the identifier of the component and the given
value, so the iteration would be called "options:e" in this case.

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

-   ``<meta accepts="[body]">`` receive the entire argument as a component.
    The argument is instantiable in HTML tag definitions as the ``<argument>``
    tag.

    Use `caller.argument.component`, which is a component constructor.

-   ``<meta accepts="[entries]">`` receive each of the child nodes as a named
    argument component. The component constructor will receive an object with
    named properties for each component.

    Use `caller.argument.children`, which is an object mapping the name of the
    child tag to a component constructor.

-   ``<meta accepts="[text]">`` receives the entire argument as a string
    from its `innerText`.

    Use `caller.argument.innerText` to access the caller template's inner text.

-   ``<meta accepts="[html]">`` receives the entire argument as a string
    from its `innerHTML`.

    Use `caller.argument.innerHTML` to access the caller templates inner HTML.

For example, this tag parenthesizes its argument.

```html
<!doctype html>
<html>
    <head>
        <meta accepts="[body]">
    </head>
    <body>(<argument></argument>)</body>
</html>
```

The `caller.argument` object will also have a `tagName`.
In a future version, it may also support attributes and a language for matching
other DOM patterns.

### Arguments and Scopes

The building block components, `<repeat>`, `<reveal>`, and `<choose>` all create
a child scope for the components instantiated by their inner template.
This has interesting implications for arguments instantiated within that scope.
Consider a `<list>` tag that contains a repetition and accepts an argument
component for each row.

```html
<!doctype html>
<html>
    <head>
        <link rel="extends" href="./list">
        <link rel="tag" href="gutentag/repeat.html">
        <meta accepts="[body]" as="row">
        <meta exports="rows:iteration" as="row">
    </head>
    <body>
        <ul><repeat id="rows">
            <li><row></row></li>
        </repeat></ul>
    </body>
</html>
```

Another component instantiates the list with a text component in each row.

```html
<!doctype html>
<html>
    <head>
        <link rel="extends" href="./essay">
        <link rel="tag" href="gutentag/text.html">
        <link rel="tag" href="./list.html">
    </head>
    <body>
        <list id="items">
            <text id="item"></text>
        </list>
    </body>
</html>
```

In the list component, each row is known as "rows:iteration".
However, the repetition also cuts through the transitive caller scopes
creating a new scope for instantiated arguments.
In this case, the list component creates an "items:row" iteration
based on the name of the caller ("items") and name exported by the list
("rows:iteration" gets exported as "row").

Thus, from within this essay, we observe the instantiation of "items:row" and
can see the value of the iteration.

```js
module.exports = Essay;
function Essay() {}
Essay.prototype.add = function (child, id, scope) {
    var components = scope.components;
    if (id === "items:row") {
        components.item.value = child.value;
    } else if (id === "this") {
        components.items.value = ["Guten Tag, Welt!", "Auf Widerseh'n, Welt!"];
    }
};
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
        <meta accepts="[body]">
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

### Space

Unlike normal HTML, by default, white space is treated as insignificant.
All text nodes are trimmed and thrown away if they only contain spaces.
However, there is a built in ``<sp>`` tag that explicitly marks parts of the
document where white space is significant.
In these regions, sequences of space are preserved.
In the following example, the string "Guten Tag, Welt!" is repeated for every
value of the greetings iteration.
The ``<sp>`` tag ensures that these greetings are delimited by space.

```html
<!doctype html>
<html>
    <head>
        <link rel="tag" href="../../repeat.html">
    </head>
    <body>
        <repeat id="greetings"><sp>Guten Tag, Welt! </sp></repeat>
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

The virtual document, with its support for body nodes, is provided by the
[Koerper] module.

[Koerper]: https://github.com/kriskowal/koerper

## License and Copyright

Copyright (c) 2015 by Kristopher Michael Kowal and contributors.
MIT License.

