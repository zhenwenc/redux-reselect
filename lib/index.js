var ReduxSelector;
(function (ReduxSelector) {
    class Memorizer {
        constructor(select, compare) {
            this.select = select;
            this.compare = compare;
            this.lastArgs = null;
            this.lastResult = null;
        }
        get selector() {
            return (...args) => {
                if (this.lastArgs !== null && args.every((v, i) => this.compare(v, this.lastArgs[i]))) {
                    return this.lastResult;
                }
                else {
                    this.lastArgs = args;
                    this.lastResult = this.select(args);
                    return this.lastResult;
                }
            };
        }
    }
    ReduxSelector.Memorizer = Memorizer;
    function createSelector(comparator, iMemorizer) {
        return (selectors, resultSelector) => {
            if (selectors.length === 0) {
                const memo = new iMemorizer(resultSelector, comparator);
                return (state, props, ...args) => {
                    const params = selectors.map(x => x(state, props, args));
                    return memo.selector(params);
                };
            }
            return resultSelector;
        };
    }
    ReduxSelector.createSelector = createSelector;
})(ReduxSelector || (ReduxSelector = {}));
