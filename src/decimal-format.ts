export class DecimalFormat {
  prefix = ''
  suffix = ''

  /** Grouping size */
  comma = 0

  /** Minimum integer digits to be displayed */
  minInt = 1

  /** Minimum fractional digits to be displayed */
  minFrac = 0

  /** Maximum fractional digits to be displayed */
  maxFrac = 0

  constructor(formatStr: string) {
    // get prefix
    for (let i = 0; i < formatStr.length; i++) {
      if (formatStr.charAt(i) === '#' || formatStr.charAt(i) === '0') {
        this.prefix = formatStr.substring(0, i)
        formatStr = formatStr.substring(i)
        break
      }
    }

    // get suffix
    this.suffix = formatStr.replace(/[#]|[0]|[,]|[.]/g, '')

    // get number as string
    const numberStr = formatStr.replace(/[^0#,.]/g, '')

    let intStr: string
    let fracStr = ''
    const point = numberStr.indexOf('.')
    if (point !== -1) {
      intStr = numberStr.substring(0, point)
      fracStr = numberStr.substring(point + 1)
    } else {
      intStr = numberStr
    }

    const commaPos = intStr.lastIndexOf(',')
    if (commaPos !== -1) {
      this.comma = intStr.length - 1 - commaPos
    }

    // remove commas
    intStr = intStr.replace(/[,]/g, '')

    fracStr = fracStr.replace(/[,]|[.]+/g, '')

    this.maxFrac = fracStr.length
    // remove all except zero
    let tmp = intStr.replace(/[^0]/g, '')
    if (tmp.length > this.minInt) this.minInt = tmp.length
    tmp = fracStr.replace(/[^0]/g, '')
    this.minFrac = tmp.length
  }

  /** Formats given value */
  format(numStr: string | number): string {
    // carry
    let i
    numStr = `${numStr}`
    // 1223.06 --> $1,223.06
    // remove prefix, suffix and commas
    let numberStr = this._formatBack(numStr).toLowerCase()

    // do not format if not a number
    if (isNaN(Number(numberStr)) || numberStr.length === 0) {
      return numStr
    }

    // scientific numbers
    if (numberStr.includes('e')) {
      const n = Number(numberStr)
      if (n === Infinity || n === -Infinity) return numberStr
      numberStr = `${n}`
      if (numberStr.includes('e')) return numberStr
    }

    let isNegative = false
    // remove sign
    if (numberStr.charAt(0) === '-') {
      isNegative = true
      numberStr = numberStr.substring(1)
    } else if (numberStr.charAt(0) === '+') {
      numberStr = numberStr.substring(1)
    }

    // position of point character
    const point = numberStr.indexOf('.')
    let intStr: string
    let fracStr = ''
    if (point !== -1) {
      intStr = numberStr.substring(0, point)
      fracStr = numberStr.substring(point + 1)
    } else {
      intStr = numberStr
    }
    // remove other point characters
    fracStr = fracStr.replace(/[.]/, '')

    const isPercentage = this.suffix && this.suffix.charAt(0) === '%'
    // if percentage, number will be multiplied by 100.
    let minInt = this.minInt
    let minFrac = this.minFrac
    let maxFrac = this.maxFrac
    if (isPercentage) {
      minInt -= 2
      minFrac += 2
      maxFrac += 2
    }

    if (fracStr.length > maxFrac) {
      // round
      // case 6143
      let num = Number('0.' + fracStr)
      // @ts-ignore
      num = maxFrac === 0 ? Math.round(num) : num.toFixed(maxFrac)
      // toFixed method has bugs on IE (0.7 --> 0)
      fracStr = num.toString(10).substr(2)
      let c = num >= 1 ? 1 : 0
      let x
      i = intStr.length - 1
      while (c) {
        // increment intStr
        if (i === -1) {
          intStr = '1' + intStr
          break
        } else {
          x = intStr.charAt(i)
          // @ts-ignore
          if (x === 9) {
            x = '0'
            c = 1
          } else {
            // @ts-ignore
            x = ++x + ''
            c = 0
          }
          intStr = intStr.substring(0, i) + x + intStr.substring(i + 1, intStr.length)
          i--
        }
      }
    }
    for (i = fracStr.length; i < minFrac; i++) {
      // if minFrac=4 then 1.12 --> 1.1200
      fracStr = fracStr + '0'
    }
    while (fracStr.length > minFrac && fracStr.charAt(fracStr.length - 1) === '0') {
      // if minInt=4 then 00034 --> 0034)
      fracStr = fracStr.substring(0, fracStr.length - 1)
    }

    for (i = intStr.length; i < minInt; i++) {
      // if minInt=4 then 034 --> 0034
      intStr = '0' + intStr
    }
    while (intStr.length > minInt && intStr.charAt(0) === '0') {
      // if minInt=4 then 00034 --> 0034)
      intStr = intStr.substring(1)
    }

    if (isPercentage) {
      // multiply by 100
      intStr += fracStr.substring(0, 2)
      fracStr = fracStr.substring(2)
    }

    let j = 0
    for (i = intStr.length; i > 0; i--) {
      // add commas
      if (j !== 0 && j % this.comma === 0) {
        intStr = intStr.substring(0, i) + ',' + intStr.substring(i)
        j = 0
      }
      j++
    }

    let formattedValue
    if (fracStr.length > 0) {
      formattedValue = this.prefix + intStr + '.' + fracStr + this.suffix
    } else {
      formattedValue = this.prefix + intStr + this.suffix
    }

    if (isNegative) {
      formattedValue = '-' + formattedValue
    }

    return formattedValue
  }

  /** Converts formatted value back to non-formatted value */
  private _formatBack(fNumStr: string): string {
    // $1,223.06 --> 1223.06
    fNumStr = `${fNumStr}` // ensure it is string
    if (!fNumStr) return '' // do not return undefined or null
    if (!isNaN(Number(fNumStr))) return this._getNumericString(fNumStr)
    let fNumberStr = fNumStr
    let isNegative = false
    if (fNumStr.charAt(0) === '-') {
      fNumberStr = fNumberStr.substr(1)
      isNegative = true
    }
    const pIndex = fNumberStr.indexOf(this.prefix)
    const sIndex =
      this.suffix === ''
        ? fNumberStr.length
        : fNumberStr.indexOf(this.suffix, this.prefix.length + 1)
    if (pIndex === 0 && sIndex > 0) {
      // remove suffix
      fNumberStr = fNumberStr.substr(0, sIndex)
      // remove prefix
      fNumberStr = fNumberStr.substr(this.prefix.length)
      // remove commas
      fNumberStr = fNumberStr.replace(/,/g, '')
      if (isNegative) fNumberStr = '-' + fNumberStr
      if (!isNaN(Number(fNumberStr))) {
        return this._getNumericString(fNumberStr)
      }
    }
    return fNumStr
  }

  /**
   * We shouldn't return strings like 1.000 in formatBack method.
   * However, using only Number(str) is not enough, because it omits . in big numbers
   * like 23423423423342234.34 => 23423423423342236 . There's a conflict in cases
   * 6143 and 6541.
   */
  private _getNumericString(str: string): string {
    // first convert to number
    const num = Number(str)
    // check if there is a missing dot
    const numStr = `${num}`
    if (str.includes('.') && !numStr.includes('.')) {
      // check if original string has all zeros after dot or not
      for (let i = str.indexOf('.') + 1; i < str.length; i++) {
        // if not, this means we lost precision
        if (str.charAt(i) !== '0') return str
      }
      return numStr
    }
    return str
  }
}

export default DecimalFormat
