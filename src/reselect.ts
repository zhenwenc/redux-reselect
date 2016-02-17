/**
 * Simple "selector" library for Redux built with ImmutableJS data structures.
 *
 * Ref: https://github.com/rackt/reselect
 */

import { Iterable, is as immutableEq } from 'immutable'

// Alias
const isImmutable = Iterable.isIterable

export interface Comparator extends Function {
  (a: any, b: any): boolean
}

export interface Selector extends Function {
  (...args: any[]): any
}

export interface Memoizer extends Function {
  (selector: Selector, comparator: Comparator): Selector
}

function throwError(message: string) {
  throw new Error(`ReduxSelector encountered error: ${message}`)
}

export function arrayEquals(a: any[], b: any[], comparator: Comparator) {
  return a !== null && b !== null && a.length === b.length
    && a.every((v, i) => comparator(v, b[i]))
}

export function simpleComparator(a: any, b: any) {
  return [a, b].every(x => x !== null && x !== undefined) && a === b
}

export function defaultComparator(a: any, b: any) {
  return (isImmutable(a) && isImmutable(b)) ? immutableEq(a, b) : simpleComparator(a, b)
}

export function defaultMemoizer(selector: Selector, comparator: Comparator) {
  let lastArgs: any[] = null
  let lastResult: any = null

  return (...args: any[]) => {
    if (arrayEquals(args, lastArgs, comparator)) {
      return lastResult
    } else {
      lastArgs = args
      lastResult = selector.apply(this, args)
      return lastResult
    }
  }
}

export function createSelectorBuilder(
  memoizer: Memoizer = defaultMemoizer,
  comparator: Comparator = defaultComparator
) {
  return (...selectors: Selector[]): Selector => {
    if (selectors.length === 0) throwError('Expecting at lease one selector.')

    const resultSelector = selectors[selectors.length - 1]
    const dependencies   = selectors.slice(0, selectors.length - 1)

    if (dependencies.length > 0) {
      const memo = memoizer.apply(this, [resultSelector, comparator])
      return (state: any, props: any, ...args: any[]) => {
        const params = dependencies.map(x => x(state, props, ...args))
        return memo.apply(this, params)
      }
    }
    return resultSelector
  }
}

// Alias: default selector builder
export const createSelector = createSelectorBuilder()
