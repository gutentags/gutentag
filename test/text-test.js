"use strict";

var mr = require("mr");
var url = require("url");

it("", function () {
    var location = mr.directoryPathToLocation(__dirname);
    var packageLocation = url.resolve(location, "..");
    return mr.loadPackage(packageLocation)
    .then(function (gutentag) {
        return gutentag.async("test/text");
    })
    .thenResolve();
});

