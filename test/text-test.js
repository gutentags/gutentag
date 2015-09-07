"use strict";

var System = require("system");
var Location = require("system/location");
var URL = require("url");

it("", function () {
    var location = Location.fromDirectory(__dirname);
    var packageLocation = URL.resolve(location, "../");
    return System.load(packageLocation)
    .then(function (system) {
        return system.import("./test/text");
    })
    .thenResolve();
});

