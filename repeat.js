
var ObservableObject = require("collections/observable-object");
require("collections/observable-array");

var empty = [];

module.exports = Repetition;
function Repetition(body, scope, argument, id) {
    this.body = body;
    this.scope = scope;
    this.iterations = [];
    this.Iteration = argument.component;
    this.id = id;
    this.valueRangeChangeObserver = null;
    this._value = null;
    this.value = [];
}

Object.defineProperty(Repetition.prototype, "value", {
    get: function () {
        return this._value;
    },
    set: function (value) {
        if (!Array.isArray(value)) {
            throw new Error('Value of repetition must be an array');
        }
        if (this.valueRangeChangeObserver) {
            this.valueRangeChangeObserver.cancel();
            this.handleValueRangeChange(empty, this._value, 0);
        }
        this._value = value;
        this.handleValueRangeChange(this._value, empty, 0);
        this.valueRangeChangeObserver =
            this._value.observeRangeChange(this, "value");
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
        var iterationScope = scope.nest();

        var iteration = new this.Iteration(iterationNode, iterationScope);
        iteration.value = value;
        iteration.index = index + offset;
        iteration.body = iterationNode;

        var id = this.id + 'Iteration';
        iterationScope[id] = iteration;
        if (scope.this.add) {
            scope.this.add(iteration, id, iterationScope);
        }

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

