// src/tests/unit/stripSensitiveFields.test.ts
import { stripSensitiveFields } from '../../../src/lib/utils'

describe('stripSensitiveFields', () => {
  it('should remove net_to_deposit from payload', () => {
    const payload = { amount: 1000, net_to_deposit: 200, other: 'test' }
    const cleaned = stripSensitiveFields(payload)
    expect(cleaned).toEqual({ amount: 1000, other: 'test' })
    // Ensure original object not mutated
    expect(payload).toHaveProperty('net_to_deposit')
  })

  it('should return same object if net_to_deposit not present', () => {
    const payload = { amount: 500 }
    const cleaned = stripSensitiveFields(payload)
    expect(cleaned).toEqual(payload)
  })
})
