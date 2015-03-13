
var parse = require("../accepts-parser").parse;

it("implicit body", function () {
    expect(parse("")).toEqual({
        type: "body",
        name: null
    });
});

it("html", function () {
    expect(parse("[html]")).toEqual({
        type: "html",
        name: null
    });
});

it("text", function () {
    expect(parse("[text]")).toEqual({
        type: "text",
        name: null
    });
});

it("body", function () {
    expect(parse("[body]")).toEqual({
        type: "body",
        name: null
    });
});

it("entries", function () {
    expect(parse("[entries]")).toEqual({
        type: "entries",
        name: null
    });
});

it("named explicit body", function () {
    expect(parse("a[body]")).toEqual({
        type: "options",
        options: {
            a: {
                type: "body",
                name: "a"
            }
        }
    });
});

it("named implicit body", function () {
    expect(parse("a")).toEqual({
        type: "options",
        options: {
            a: {
                type: "body",
                name: "a"
            }
        }
    });
});

it("named implicit body", function () {
    expect(parse("rh ch cd corner")).toEqual({
        type: "options",
        options: {
            rh: {
                type: "body",
                name: "rh"
            },
            ch: {
                type: "body",
                name: "ch"
            },
            cd: {
                type: "body",
                name: "cd"
            },
            corner: {
                type: "body",
                name: "corner"
            }
        }
    });
});

it("option as name", function () {
    expect(parse("x:y")).toEqual({
        type: "options",
        options: {
            x: {
                type: "body",
                name: "x",
                as: "y"
            }
        }
    });
});

it("tag within tag", function () {
    expect(parse("a(b)")).toEqual({
        type: "options",
        options: {
            a: {
                type: "options",
                name: "a",
                options: {
                    b: {
                        type: "body",
                        name: "b"
                    }
                }
            }
        }
    });
});

it("promise", function () {
    expect(parse("fulfilled rejected pending")).toEqual({
        type: "options",
        options: {
            fulfilled: {
                type: "body",
                name: "fulfilled"
            },
            rejected: {
                type: "body",
                name: "rejected"
            },
            pending: {
                type: "body",
                name: "pending"
            }
        }
    });
});

it("select", function () {
    expect(parse("option[text] optgroup(option[text])")).toEqual({
        type: "options",
        options: {
            option: {
                type: "text",
                name: "option"
            },
            optgroup: {
                type: "options",
                name: "optgroup",
                options: {
                    option: {
                        type: "text",
                        name: "option"
                    }
                }
            }
        }
    });
});

