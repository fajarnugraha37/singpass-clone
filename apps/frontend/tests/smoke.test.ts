import { expect, test, describe } from 'bun:test'

describe('Frontend Smoke Test', () => {
  test('Astro environment should be defined', () => {
    // Basic test to verify runner works in frontend workspace
    expect(true).toBe(true)
  })
})
