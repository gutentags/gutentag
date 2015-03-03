"use strict";

var Program = require("../program");

it("produces and digests a document", function () {
    var program = new Program();
    var root = program.documentElement;
    root.add("1\n");
    var section = root.indent();
    section.add("2\n");
    section.add("3\n");
    root.add("4\n");
    expect(program.digest()).toBe("1\n    2\n    3\n4\n");
});

it("removes a section", function () {
    var program = new Program();
    var root = program.documentElement;
    root.add("1\n");
    var section = root.indent();
    section.add("2\n");
    section.add("3\n");
    root.removeChild(section);
    root.add("4\n");
    expect(program.digest()).toBe("1\n4\n");
});
