import DecimalFormat from '../src/decimal-format'
/**
 * DecimalFormat test
 */

describe('DecimalFormat test', () => {
  it('should be instantiable', () => {
    expect(new DecimalFormat('#')).toBeInstanceOf(DecimalFormat)
  })
  it('format correctly', () => {
    expect(new DecimalFormat('#').format(100)).toEqual('100')
    expect(new DecimalFormat('#').format(100.5)).toEqual('101')
    expect(new DecimalFormat('#,##0.##').format(100.5)).toEqual('100.5')
    expect(new DecimalFormat('0.00').format(100.5)).toEqual('100.50')
    expect(new DecimalFormat('0.00').format(100)).toEqual('100.00')
    expect(new DecimalFormat('0E0').format(12345)).toEqual('1E4')
  })
})
