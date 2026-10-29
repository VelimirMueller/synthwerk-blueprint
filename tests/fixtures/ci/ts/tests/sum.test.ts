import { expect, test } from 'vitest'
import { sum } from '../src/sum.js'

test('sum - three numbers - adds them', () => {
  expect(sum([1, 2, 3])).toBe(6)
})
