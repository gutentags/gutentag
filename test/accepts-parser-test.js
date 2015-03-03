
var parse = require("../accepts-parser").parse;

it("implicit body", function () {
    expect(parse("")).toEqual({
        type: "body",
        pattern: {
            type: "any"
        }
    });
});

it("html", function () {
    expect(parse("[html]")).toEqual({
        type: "html",
        pattern: {
            type: "any"
        }
    });
});

it("text", function () {
    expect(parse("[text]")).toEqual({
        type: "text",
        pattern: {
            type: "any"
        }
    });
});

it("body", function () {
    expect(parse("[body]")).toEqual({
        type: "body",
        pattern: {
            type: "any"
        }
    });
});

it("entries", function () {
    expect(parse("[entries]")).toEqual({
        type: "entries",
        pattern: {
            type: "any"
        }
    });
});

it("named explicit body", function () {
    expect(parse("a[body]")).toEqual({
        type: "body",
        pattern: {
            type: "name",
            name: "a"
        }
    });
});

it("named implicit body", function () {
    expect(parse("a")).toEqual({
        type: "body",
        pattern: {
            type: "name",
            name: "a"
        }
    });
});

it("tag within tag", function () {
    expect(parse("a(b)")).toEqual({
        type: "children",
        pattern: {
            type: "name",
            name: "a"
        },
        children: {
            type: "body",
            pattern: {
                type: "name",
                name: "b"
            }
        }
    });
});

it("promise", function () {
    expect(parse("fulfilled rejected pending")).toEqual({
        type: "options",
        options: [
            {
                type: "body",
                pattern: {
                    type: "name",
                    name: "fulfilled"
                }
            },
            {
                type: "body",
                pattern: {
                    type: "name",
                    name: "rejected"
                }
            },
            {
                type: "body",
                pattern: {
                    type: "name",
                    name: "pending"
                }
            }
        ]
    });
});

it("plural option", function () {
    expect(parse("option[text]*")).toEqual({
        type: "multiple",
        of: {
            type: "text",
            pattern: { type: "name", name: "option" },
        }
    });
});

it("select", function () {
    expect(parse("option[text]* optgroup(option[text]*)*")).toEqual({
        type: "options",
        options: [
            {
                type: "multiple",
                of: {
                    type: "text",
                    pattern: { type: "name", name: "option" }
                }
            },
            {
                type: "multiple",
                of: {
                    type: "children",
                    pattern: { type: "name", name: "optgroup" },
                    children: {
                        type: "multiple",
                        of: {
                            type: "text",
                            pattern: { type: "name", name: "option" }
                        }
                    }
                }
            }
        ]
    });
});

