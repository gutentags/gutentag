
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

it("plural option as name", function () {
    expect(parse("x:y*")).toEqual({
        type: "options",
        options: {
            x: {
                type: "multiple",
                of: {
                    type: "body",
                    name: "x"
                },
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
                type: "children",
                name: "a",
                children: {
                    type: "options",
                    options: {
                        b: {
                            type: "body",
                            name: "b"
                        }
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

it("plural option", function () {
    expect(parse("option[text]*")).toEqual({
        type: "options",
        options: {
            option: {
                type: "multiple",
                of: {
                    type: "text",
                    name: "option"
                },
                name: "option"
            }
        }
    });
});

it("select", function () {
    expect(parse("option[text]* optgroup(option[text]*)*")).toEqual({
        type: "options",
        options: {
            option: {
                type: "multiple",
                of: {
                    type: "text",
                    name: "option"
                },
                name: "option"
            },
            optgroup: {
                type: "multiple",
                of: {
                    type: "children",
                    name: "optgroup",
                    children: {
                        type: "options",
                        options: {
                            option: {
                                type: "multiple",
                                of: {
                                    type: "text",
                                    name: "option"
                                },
                                name: "option"
                            }
                        }
                    }
                },
                name: "optgroup"
            }
        }
    });
});

