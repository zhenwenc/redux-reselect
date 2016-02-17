/**
 * Simple "selector" library for Redux built with ImmutableJS data structures.
 *
 * Ref: https://github.com/rackt/reselect
 */
var immutable_1 = require('immutable');
// Alias
var isImmutable = immutable_1.Iterable.isIterable;
function throwError(message) {
    throw new Error("ReduxSelector encountered error: " + message);
}
function arrayEquals(a, b, comparator) {
    return a !== null && b !== null && a.length === b.length
        && a.every(function (v, i) { return comparator(v, b[i]); });
}
exports.arrayEquals = arrayEquals;
function simpleComparator(a, b) {
    return [a, b].every(function (x) { return x !== null && x !== undefined; }) && a === b;
}
exports.simpleComparator = simpleComparator;
function defaultComparator(a, b) {
    return (isImmutable(a) && isImmutable(b)) ? immutable_1.is(a, b) : simpleComparator(a, b);
}
exports.defaultComparator = defaultComparator;
function defaultMemoizer(selector, comparator) {
    var _this = this;
    var lastArgs = null;
    var lastResult = null;
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        if (arrayEquals(args, lastArgs, comparator)) {
            return lastResult;
        }
        else {
            lastArgs = args;
            lastResult = selector.apply(_this, args);
            return lastResult;
        }
    };
}
exports.defaultMemoizer = defaultMemoizer;
function createSelectorBuilder(memoizer, comparator) {
    var _this = this;
    if (memoizer === void 0) { memoizer = defaultMemoizer; }
    if (comparator === void 0) { comparator = defaultComparator; }
    return function () {
        var selectors = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            selectors[_i - 0] = arguments[_i];
        }
        if (selectors.length === 0)
            throwError('Expecting at lease one selector.');
        var resultSelector = selectors[selectors.length - 1];
        var dependencies = selectors.slice(0, selectors.length - 1);
        if (dependencies.length > 0) {
            var memo = memoizer.apply(_this, [resultSelector, comparator]);
            return function (state, props) {
                var args = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    args[_i - 2] = arguments[_i];
                }
                var params = dependencies.map(function (x) { return x.apply(void 0, [state, props].concat(args)); });
                return memo.apply(_this, params);
            };
        }
        return resultSelector;
    };
}
exports.createSelectorBuilder = createSelectorBuilder;
// Alias: default selector builder
exports.createSelector = createSelectorBuilder();
