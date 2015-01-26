"use strict";

var Document = require("../dom-body");
var domenic = require("domenic");
var DOMParser = domenic.DOMParser;

var parser, actualDocument, document, actualRoot, root;
beforeEach(function () {
    parser = new DOMParser();
    actualDocument = parser.parseFromString("<!doctype html><body></body>", "text/html");
    document = new Document(actualDocument.firstChild);
    root = document.documentElement;
    actualRoot = actualDocument.firstChild;
});

it("can append text to document element", function () {
    var text = document.createTextNode("Hello, World!");
    root.appendChild(text);
    expect(root.innerHTML).toBe("Hello, World!");
});

it("add text to body, body to root", function test() {
    var body = document.createBody();
    var text = document.createTextNode("Hello, World!");
    body.appendChild(text);
    expect(body.innerHTML).toBe("Hello, World!");
    root.appendChild(body);
    expect(root.innerHTML).toBe("Hello, World!");
});

it("and body to root, text to body", function () {
    var body = document.createBody();
    var text = document.createTextNode("Hello, World!");
    root.appendChild(body);
    expect(body.innerHTML).toBe("");
    expect(root.innerHTML).toBe("");
    body.appendChild(text);
    expect(root.innerHTML).toBe("Hello, World!");
});

describe("greeting redux", function () {
    var body, subject, hello, world, comma, object, world, bang;
    beforeEach(function () {
        body = document.createBody();
        subject = document.createBody();
        hello = document.createTextNode("Guten Tag");
        comma = document.createTextNode(", ");
        object = document.createBody();
        world = document.createTextNode("Welt");
        bang = document.createTextNode("!");
        subject.appendChild(hello);
        subject.appendChild(comma);
        object.appendChild(world);
        object.appendChild(bang);
        body.appendChild(subject);
        body.appendChild(object);
    });

    it("whole string", function () {
        expect(body.innerHTML).toBe("Guten Tag, Welt!");
    });

    it("remove first direct child", function () {
        body.removeChild(subject);
        expect(body.innerHTML).toBe("Welt!");
    });

    it("remove second direct child", function () {
        body.removeChild(object);
        expect(body.innerHTML).toBe("Guten Tag, ");
    });

    it("remove some grandchildren", function () {
        subject.removeChild(hello);
        object.removeChild(world);
        expect(body.innerHTML).toBe(", !");
    });
});

