'use strict'

import { expect } from 'chai'
import { fromJS } from 'immutable'
import { memoize as lodashMemoize } from 'lodash'
import {
  defaultComparator,
  defaultMemoizer,
  createSelector,
  createSelectorBuilder
} from '../src/reselect'

const testMemoizer = defaultMemoizer(state => state.x, defaultComparator)

describe('ReduxSelector', () => {

  describe('default comparator', () => {
    it('should return false if either side is null or undefined', () => {
      expect(defaultComparator(null, [])).to.be.false
      expect(defaultComparator([], null)).to.be.false
      expect(defaultComparator(undefined, {})).to.be.false
      expect(defaultComparator({}, undefined)).to.be.false
    })

    it('should return false if both sides are null or undefined', () => {
      expect(defaultComparator(null, null)).to.be.false
      expect(defaultComparator(undefined, undefined)).to.be.false
    })

    it('should return true with same object', () => {
      const args = { a: 'foo', b: 101 }
      expect(defaultComparator(args, args)).to.be.true
    })

    it('should return true with immutable objects of same content', () => {
      const arg1 = fromJS({ x: 100, y: 200 })
      const arg2 = fromJS({ x: 100, y: 200 })
      expect(defaultComparator(arg1, arg2)).to.be.true
    })

    it('should return true with immutable arrays of same elements', () => {
      const arg1 = fromJS(['foo', { x: 99 }])
      const arg2 = fromJS(['foo', { x: 99 }])
      expect(defaultComparator(arg1, arg2)).to.be.true
    })

    it('should not convert native JS object to immutable', () => {
      const arg1 = { x: 1 }
      const arg2 = fromJS(arg1)
      expect(defaultComparator(arg1, arg2)).to.be.false
    })
  })

  describe('default memoizer', () => {
    it('should initialize cached value', () => {
      expect(testMemoizer({ x: 101 })).to.be.eq(101)
    })

    it('should update cached value', () => {
      expect(testMemoizer({ x: 'foo' })).to.be.eq('foo')
      expect(testMemoizer({ x: 'bar' })).to.be.eq('bar')
    })

    it('should recompute only if the arguments are changed', () => {
      let counter = 0
      const memo = defaultMemoizer(
        state => {
          counter++
          return state.x
        }, defaultComparator)

      const state1 = { x: 'before' }
      const state2 = { x: 'after'  }
      expect(memo(state1)).to.be.eq('before')
      expect(memo(state1)).to.be.eq('before')
      expect(counter).to.be.eq(1)
      expect(memo(state2)).to.be.eq('after')
      expect(counter).to.be.eq(2)
    })
  })

  describe('create selector builder', () => {
    it('should use custom memoizer', () => {
      const createCustomSelector = createSelectorBuilder(lodashMemoize)
      const selector = createCustomSelector(
        state => state.x
      )
      expect(selector({ x: 'foo' })).to.be.eq('foo')
      expect(selector({ x: 'bar' })).to.be.eq('bar')
      expect(selector({ y: 'wow' })).to.be.eq(undefined)
    })

    it('should use custom comparator', () => {
      const lengthComparator = (a: any, b: any) => {
        return a.toString.length === b.toString.length
      }
      const createCustomSelector = createSelectorBuilder(defaultMemoizer, lengthComparator)
      const selector = createCustomSelector(
        state => state.x,
        (x: string) => 'Hello ' + x
      )
      expect(selector({ x: 'foo' })).to.be.eq('Hello foo')
      expect(selector({ x: 'bar' })).to.be.eq('Hello foo') // length of `foo` and `bar` is the same
    })
  })

  describe('create selector', () => {
    it('should fail if no given selector', () => {
      expect(() => createSelector()).to.throw(/Expecting at lease one selector/)
    })

    it('should support single selector', () => {
      const selector = createSelector(
        state => state.x
      )
      expect(selector({ x: 'foo' })).to.be.eq('foo')
      expect(selector({ x: 'bar' })).to.be.eq('bar')
      expect(selector({ y: 'wow' })).to.be.eq(undefined)
    })

    it('should support single dependency selector', () => {
      const selector = createSelector(
        state => state.x,
        x => x * x
      )
      expect(selector({ x: 2 })).to.be.eq(4)
      expect(selector({ x: 3 })).to.be.eq(9)
    })

    it('should support multiple dependency selectors', () => {
      const selector = createSelector(
        state => state.a,
        state => state.b,
        (a, b) => `${a} said: ${b}`
      )
      expect(selector({ a: 'Roy', b: 'Hello!' })).to.be.eq('Roy said: Hello!')
      expect(selector({ a: 'Foo', b: 101 })).to.be.eq('Foo said: 101')
    })

    it('should support composite dependency selectors', () => {
      const selector1 = createSelector(
        state => state.x,
        x => Math.pow(2, x)
      )
      const selector2 = createSelector(
        selector1,
        state => state.y,
        (x, y) => x + y
      )
      expect(selector2({ x: 3, y: 15 })).to.be.eq(23)
      expect(selector2({ x: 2, y: 9 })).to.be.eq(13)
    })

    it('single selector should accept props', () => {
      let counter = 0
      const selector = createSelector(
        state => state.x,
        state => state.y,
        (state, props) => state.z * props.a,
        (x, y, z) => { counter++; return x + y + z }
      )
      expect(selector({ x: 10, y: 13, z: 2 }, { a: 7 })).to.be.eq(37)
      expect(counter).to.be.eq(1)
      // update neither state or props
      expect(selector({ x: 10, y: 13, z: 2 }, { a: 7 })).to.be.eq(37)
      expect(counter).to.be.eq(1)
      // update both state and props
      expect(selector({ x: 8, y: 11, z: 3 }, { a: 3 })).to.be.eq(28)
      expect(counter).to.be.eq(2)
      // update only props
      expect(selector({ x: 8, y: 11, z: 3 }, { a: 4 })).to.be.eq(31)
      expect(counter).to.be.eq(3)
      // update unrelated state
      expect(selector({ x: 8, y: 11, z: 3, m: 'foo' }, { a: 4 })).to.be.eq(31)
      expect(counter).to.be.eq(3)
      // update unrelated props
      expect(selector({ x: 8, y: 11, z: 3 }, { a: 4, b: 'bar' })).to.be.eq(31)
      expect(counter).to.be.eq(3)
    })

    it('single selector should accept variadic arguments', () => {
      let counter = 0
      const selector = createSelector(
        state => state.x,
        state => state.y,
        (state, props, m) => state.z * m,
        (x, y, z) => { counter++; return x + y + z }
      )
      expect(selector({ x: 2, y: 3, z: 4 }, { a: 'p' }, 4)).to.be.eq(21)
      expect(counter).to.be.eq(1)
      // update neither state, props, or variadic arguments
      expect(selector({ x: 2, y: 3, z: 4 }, { a: 'p' }, 4)).to.be.eq(21)
      expect(counter).to.be.eq(1)
      // update only variadic arguments
      expect(selector({ x: 2, y: 3, z: 4 }, { a: 'p' }, 7)).to.be.eq(33)
      expect(counter).to.be.eq(2)
      // update only the related props
      expect(selector({ x: 2, y: 3, z: 4 }, { a: 'x' }, 7)).to.be.eq(33)
      expect(counter).to.be.eq(2)
      // update unrelated state
      expect(selector({ x: 2, y: 3, z: 4, m: 'foo' }, { a: 'x' }, 7)).to.be.eq(33)
      expect(counter).to.be.eq(2)
      // update unrelated variadic arguments
      expect(selector({ x: 2, y: 3, z: 4 }, { a: 'x' }, 7, 'foo')).to.be.eq(33)
      expect(counter).to.be.eq(2)
    })

    it('dependency selectors should accept props', () => {
      let counter1 = 0,
          counter2 = 0,
          counter3 = 0
      const selector1 = createSelector(
        state => state.x,
        x => { counter1++; return x * 2 }
      )
      const selector2 = createSelector(
        (_, props) => props.a,
        a => { counter2++; return a * 3 }
      )
      const selector3 = createSelector(
        selector1,
        selector2,
        (x, y) => { counter3++; return x + y }
      )
      expect(selector3({ x: 2 }, { a: 4 })).to.be.eq(16)
      expect((counter1, counter2, counter3)).to.be.eq((1, 1, 1))
      // update neither state, props, or variadic arguments
      expect(selector3({ x: 2 }, { a: 4 })).to.be.eq(16)
      expect((counter1, counter2, counter3)).to.be.eq((1, 1, 1))
      // update unrelated state, props, and variadic arguments
      expect(selector3({ x: 2, y: 5 }, { a: 4, b: 7 })).to.be.eq(16)
      expect((counter1, counter2, counter3)).to.be.eq((1, 1, 1))
      // update only state
      expect(selector3({ x: 3, y: 5 }, { a: 4, b: 7 })).to.be.eq(18)
      expect((counter1, counter2, counter3)).to.be.eq((2, 2, 2))
      // update only props
      expect(selector3({ x: 3, y: 5 }, { a: 5, b: 7 })).to.be.eq(21)
      expect((counter1, counter2, counter3)).to.be.eq((2, 3, 3))
    })

    it('dependency selectors should accept variadic arguments', () => {
      let counter1 = 0,
          counter2 = 0,
          counter3 = 0
      const selector1 = createSelector(
        state => state.x,
        x => { counter1++; return x * 2 }
      )
      const selector2 = createSelector(
        (_, props) => props.a,
        a => { counter2++; return a * 3 }
      )
      const selector3 = createSelector(
        selector1,
        selector2,
        (_1, _2, m, n) => m / n,
        (x, a, o) => { counter3++; return x + a + o }
      )
      expect(selector3({ x: 2 }, { a: 4 }, 10, 5)).to.be.eq(18)
      expect((counter1, counter2, counter3)).to.be.eq((1, 1, 1))
      // update neither state, props, or variadic arguments
      expect(selector3({ x: 2 }, { a: 4 }, 10, 5)).to.be.eq(18)
      expect((counter1, counter2, counter3)).to.be.eq((1, 1, 1))
      // update unrelated state, props, and variadic arguments
      expect(selector3({ x: 2, y: 5 }, { a: 4, b: 5 }, 10, 5, 7)).to.be.eq(18)
      expect((counter1, counter2, counter3)).to.be.eq((1, 1, 1))
      // update only state
      expect(selector3({ x: 3, y: 5 }, { a: 4, b: 5 }, 10, 5, 7)).to.be.eq(20)
      expect((counter1, counter2, counter3)).to.be.eq((2, 2, 2))
      // update only props
      expect(selector3({ x: 3, y: 5 }, { a: 5, b: 5 }, 10, 5, 7)).to.be.eq(23)
      expect((counter1, counter2, counter3)).to.be.eq((2, 3, 3))
      // upadte only variadic arguments
      expect(selector3({ x: 3, y: 5 }, { a: 5, b: 5 }, 10, 2, 7)).to.be.eq(26)
      expect((counter1, counter2, counter3)).to.be.eq((2, 3, 4))
    })

    it('should not recompute composite selectors', () => {
      let counter1 = 0, counter2 = 0
      const selector1 = createSelector(
        state => state.x,
        x => { counter1++; return x * 2 }
      )
      const selector2 = createSelector(
        selector1,
        x => { counter2++; return x * 3 }
      )
      expect(selector2({ x: 10 })).to.be.eq(60)
      expect((counter1, counter2)).to.be.eq((1, 1))
      expect(selector2({ x: 10 })).to.be.eq(60)
      expect((counter1, counter2)).to.be.eq((1, 1))
      expect(selector2({ x: 20 })).to.be.eq(120)
      expect((counter1, counter2)).to.be.eq((2, 2))
    })
  })
})
