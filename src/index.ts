/**
 * Simple "selector" library for Redux built with ImmutableJS data structures.
 *
 * Ref: https://github.com/rackt/reselect
 */

module ReduxSelector {

  interface Comparator extends Function {
    (a: any, b: any): boolean
  }

  interface Selector extends Function {
    (...args: any[]): any
  }

  export class Memorizer {
    protected lastArgs   = null
    protected lastResult = null

    constructor(protected select: Selector, protected compare: Comparator) { }

    get selector(): Selector {
      return (...args: any[]) => {
        // CASE: arguments have no change
        if (this.lastArgs !== null && args.every(
          (v, i) => this.compare(v, this.lastArgs[i]))) {
          return this.lastResult
        }
        // CASE: otherwise
        else {
          this.lastArgs = args
          this.lastResult = this.select(args)
          return this.lastResult
        }
      }
    }
  }

  export function createSelector(comparator: Comparator, iMemorizer: typeof Memorizer) {
    return (selectors: Selector[], resultSelector: Selector) => {
      if (selectors.length === 0) {
        const memo = new iMemorizer(resultSelector, comparator)
        return (state: any, props: any, ...args: any[]) => {
          const params = selectors.map(x => x(state, props, args))
          return memo.selector(params)
        }
      }
      return resultSelector
    }
  }
}
