
var ObservableObject = require("collections/observable-object");
require("collections/observable-array");

module.exports = Repetition;
function Repetition(body, scope, argument, id) {
    this.body = body;
    this.scope = scope;
    this.iterations = [];
    this.Iteration = argument.component;
    this.id = id;
    this._value = [];
    this._value.observeRangeChange(this, "value");
}

Object.defineProperty(Repetition.prototype, "value", {
    get: function () {
        return this._value;
    },
    set: function (value) {
        this._value.swap(0, this._value.length, value);
    }
});

Repetition.prototype.handleValueRangeChange = function (plus, minus, index) {
    var scope = this.scope;
    var body = this.body;
    var document = this.body.ownerDocument;

    this.iterations.slice(index, index + minus.length)
    .forEach(function (iteration, offset) {
        body.removeChild(iteration.body);
        iteration.value = null;
        iteration.index = null;
        iteration.body = null;
        if (iteration.destroy) {
            iteration.destroy();
        }
    }, this);

    var nextIteration = this.iterations[index + 1];
    var nextSibling = nextIteration && nextIteration.body;

    this.iterations.swap(index, minus.length, plus.map(function (value, offset) {
        var iterationNode = document.createBody();
        var iteration = Object.create(this.Iteration.prototype);
        var iterationScope = scope.nest();
        iterationScope[this.id + 'Iteration'] = iteration;
        iteration.value = value;
        iteration.index = index + offset;
        iteration.body = iterationNode;
        this.Iteration.call(iteration, iterationNode, iterationScope);
        body.insertBefore(iterationNode, nextSibling);
        return iteration;
    }, this));

    this.updateIndexes(index);
};

Repetition.prototype.updateIndexes = function (index) {
    for (var length = this.iterations.length; index < length; index++) {
        this.iterations[index].index = index;
    }
};

Repetition.prototype.redraw = function (region) {
    this.iterations.forEach(function (iteration) {
        iteration.redraw(region);
    }, this);
};

