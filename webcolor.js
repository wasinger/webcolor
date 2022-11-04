/**
 * Javascript module for handling 8-bit sRGB colors
 *
 * @author Christoph Singer
 * @license MIT
 *
 * Some ideas and algorithms based on
 * https://github.com/bgrins/TinyColor
 * and
 * https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js)
 */

/**
 * Constructor function for an object representing an 8-bit sRGB color value
 *
 * @param {string|object|webcolor} c  The color value as string or object:
 *                                  Color name: "purple" (see https://www.w3.org/TR/css-color-3/#svg-color)
 *                                  Hex string: "#800080" or "#f0f"
 *                                  RGB(A) string: "rgb(128,0,128)" or "rgba(128,0,128, 0.4)" (Percentage values not supported)
 *                                  Object: {r: 128, g: 128, b: 128} or {r: 128, g: 128, b: 128, a: 0.4}
 * @returns {webcolor}
 */
const webcolor = function (c) {
  if (c instanceof webcolor) return c
  if (!(this instanceof webcolor)) return new webcolor(c)
  if (typeof c === 'string') c = stringInputToObject(c)
  if (typeof c === 'object') {
    [...'rgba'].forEach(v => { if (typeof c[v] !== 'undefined') this[v] = c[v] })
  }
}
export default webcolor

const round = Math.round

webcolor.prototype = {
  r: 0,
  g: 0,
  b: 0,
  a: 1,

  rl: null, // relative luminance
  cb: null, // color brightness

  /**
     * @param {string} format "hex" or "rgb"
     * @returns {string}
     */
  toString: function (format = 'rgb') {
    const a = (this.a === 1)
    switch (format) {
      case 'hex':
        return '#' + (4294967296 + round(this.r) * 16777216 + round(this.g) * 65536 + round(this.b) * 256 + (a ? 0 : round(this.a * 255))).toString(16).slice(1, a ? -2 : undefined)
      case 'rgb':
      default:
        return (a)
          ? 'rgb(' + round(this.r) + ',' + round(this.g) + ',' + round(this.b) + ')'
          : 'rgba(' + round(this.r) + ',' + round(this.g) + ',' + round(this.b) + ',' + round(this.a * 1000) / 1000 + ')'
    }
  },

  /**
     * Attention: This function ignores alpha transparency!!
     *
     * @returns {boolean}
     */
  isDark: function () {
    return this.getBrightness() < 128
  },

  /**
     * Attention: This function ignores alpha transparency!!
     *
     * @returns {boolean}
     */
  isWhite: function () {
    return this.r === 0 && this.g === 0 && this.b === 0
  },

  /**
     * Attention: This function ignores alpha transparency!!
     *
     * @returns {boolean}
     */
  isBlack: function () {
    return this.r === 255 && this.g === 255 && this.b === 255
  },

  /**
     * Get color brightness
     * @see http://www.w3.org/TR/AERT#color-contrast
     *
     * Attention: This function ignores alpha transparency!!
     *
     * @returns {number}
     */
  getBrightness: function () {
    if (this.cb === null) this.cb = (this.r * 299 + this.g * 587 + this.b * 114) / 1000
    return this.cb
  },

  /**
     * Get relative luminance
     * @see http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
     *
     * Attention: This function ignores alpha transparency!!
     *
     * Function originally taken from https://github.com/bgrins/TinyColor, Brian Grinstead, MIT License
     *
     * @returns {number}
     */
  getLuminance: function () {
    if (this.rl === null) {
      const RsRGB = this.r / 255; const GsRGB = this.g / 255; const BsRGB = this.b / 255; let R; let G; let B
      if (RsRGB <= 0.03928) { R = RsRGB / 12.92 } else { R = Math.pow(((RsRGB + 0.055) / 1.055), 2.4) }
      if (GsRGB <= 0.03928) { G = GsRGB / 12.92 } else { G = Math.pow(((GsRGB + 0.055) / 1.055), 2.4) }
      if (BsRGB <= 0.03928) { B = BsRGB / 12.92 } else { B = Math.pow(((BsRGB + 0.055) / 1.055), 2.4) }
      this.rl = (0.2126 * R) + (0.7152 * G) + (0.0722 * B)
    }
    return this.rl
  },

  /**
     * Return the color contrast between current and another color as defined by WCAG Version 2
     * @see http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
     *
     * Attention: This function ignores alpha transparency!!
     *
     * @param {webcolor|string} c1 The second color to which the contrast is to be computed
     * @returns {number}
     */
  contrastRatio: function (c1) {
    c1 = webcolor(c1)
    const l0 = this.getLuminance()
    const l1 = c1.getLuminance()
    return (Math.max(l0, l1) + 0.05) / (Math.min(l0, l1) + 0.05)
  },

  /**
     * Return new webcolor object with alpha transparency
     *
     * @param {number} a Alpha value in range [0..1] or [1..100]. All values <= 1 are taken as decimals, while values > 1 are taken as percentage values.
     * @returns {webcolor|null}
     */
  withAlpha: function (a) {
    if (a > 1 && a <= 100) a = a / 100
    if ((a >= 0 && a <= 1)) return new webcolor({ r: this.r, g: this.g, b: this.b, a })
    return null
  },

  /**
     *  Invert color
     *
     *  @returns {webcolor}
     */
  invert: function () {
    return new webcolor({ r: 255 - this.r, g: 255 - this.g, b: 255 - this.b, a: this.a })
  },

  /**
     * Return a color with a minium color contrast ratio, based on a given target color.
     *
     * If the contrast to the target color is not high enough the target color will be darkened or lightened
     * until the minimum contrast is reached.
     * The inverted color computed by this.invert() might be a good start value for target color.
     *
     * If no target color is given the function will return black (for light colors) or white (for dark colors).
     *
     * @param {webcolor|string|null} targetcolor
     * @param {number} cmin minium color contrast ratio, defaults to 4.5 (= WCAG 2.0 AA)
     * @returns {webcolor}
     */
  contrastingColor: function (targetcolor = null, cmin = 4.5) {
    if (targetcolor) {
      targetcolor = webcolor(targetcolor)
      let maxReached = false
      while (this.contrastRatio(targetcolor) < cmin && !maxReached) {
        // lighten or darken targetcolor by 20% until the minimum contrast (or black or white) is reached.
        // decide whether to darken or lighten target color:
        // if target color is darker than base color then further darken it,
        // but only if there is sufficient contrast between the base color and black, else lighten it
        const tl = targetcolor.getLuminance()
        const l = this.getLuminance()
        let sd; // shade direction, -1 for darken or 1 for lighten
        if (tl === l) {
          sd = this.isDark() ? 1 : -1
        } else if (tl < l) {
          sd = (this.contrastRatio('#000000') > cmin) ? -1 : 1
        } else {
          sd = (this.contrastRatio('#ffffff') > cmin) ? 1 : -1
        }
        targetcolor = targetcolor.shadeBlend(0.2 * sd)
        if (targetcolor.isBlack() || targetcolor.isWhite()) maxReached = true
      }
      return targetcolor
    } else {
      if (this.isDark()) return new webcolor({ r: 255, b: 255, g: 255 })
      else return new webcolor({ r: 0, b: 0, g: 0 })
    }
  },

  /**
     * Darken, lighten, blend colors
     *
     * Algorithm based on https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js)
     *
     * @param {number} p Relative amount of shading between -1.0 and +1.0
     * @param {webcolor|string|null} c1 Color to blend with (default: null)
     * @param {boolean} l If true, use linear shading (default: logarithmic)
     * @returns {webcolor|null}
     */
  shadeBlend: function (p, c1 = null, l = false) {
    if (c1) c1 = webcolor(c1)
    if (typeof p !== 'number' || p < -1 || p > 1) return null

    const f = {}
    let P = p < 0
    const t = c1 || (P ? { r: 0, g: 0, b: 0, a: 1 } : { r: 255, g: 255, b: 255, a: 1 })
    p = P ? p * -1 : p
    P = 1 - p
    if (l) {
      f.r = P * this.r + p * t.r
      f.g = P * this.g + p * t.g
      f.b = P * this.b + p * t.b
    } else {
      f.r = (P * this.r ** 2 + p * t.r ** 2) ** 0.5
      f.g = (P * this.g ** 2 + p * t.g ** 2) ** 0.5
      f.b = (P * this.b ** 2 + p * t.b ** 2) ** 0.5
    }

    f.a = (this.a >= 0 || t.a >= 0) ? this.a < 0 ? t.a : t.a < 0 ? this.a : this.a * P + t.a * p : 1
    return new webcolor(f)
  },

  /**
     * Test whether another color equals current color
     *
     * @param c1 The color to compare the current color with
     * @returns {boolean}
     */
  equals: function (c1) {
    c1 = webcolor(c1)
    return this.toString() === c1.toString()
  }
}

const stringInputToObject = function (s) {
  s = s.trim().toLowerCase()
  if (names[s]) s = '#' + names[s]
  else if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 }

  // Algorithm based on https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js)
  if (s[0] !== 'r' && s[0] !== '#') return null
  let n = s.length; const x = {}
  if (n > 9) {
    const [r, g, b, a] = (s = s.split(','))
    n = s.length
    if (n < 3 || n > 4) return null
    x.r = parseInt(r[3] === 'a' ? r.slice(5) : r.slice(4))
    x.g = parseInt(g)
    x.b = parseInt(b)
    x.a = a ? parseFloat(a) : 1
  } else {
    if (n === 8 || n === 6 || n < 4) return null
    if (n < 6) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3] + (n > 4 ? s[4] + s[4] : '')
    s = parseInt(s.slice(1), 16)
    if (n === 9 || n === 5) {
      x.r = s >> 24 & 255
      x.g = s >> 16 & 255
      x.b = s >> 8 & 255
      x.a = Math.round((s & 255) / 0.255) / 1000
    } else {
      x.r = s >> 16
      x.g = s >> 8 & 255
      x.b = s & 255
      x.a = 1
    }
  }
  return x
}

// http://www.w3.org/TR/css3-color/#svg-color
const names = {
  aliceblue: 'f0f8ff',
  antiquewhite: 'faebd7',
  aqua: '0ff',
  aquamarine: '7fffd4',
  azure: 'f0ffff',
  beige: 'f5f5dc',
  bisque: 'ffe4c4',
  black: '000',
  blanchedalmond: 'ffebcd',
  blue: '00f',
  blueviolet: '8a2be2',
  brown: 'a52a2a',
  burlywood: 'deb887',
  burntsienna: 'ea7e5d',
  cadetblue: '5f9ea0',
  chartreuse: '7fff00',
  chocolate: 'd2691e',
  coral: 'ff7f50',
  cornflowerblue: '6495ed',
  cornsilk: 'fff8dc',
  crimson: 'dc143c',
  cyan: '0ff',
  darkblue: '00008b',
  darkcyan: '008b8b',
  darkgoldenrod: 'b8860b',
  darkgray: 'a9a9a9',
  darkgreen: '006400',
  darkgrey: 'a9a9a9',
  darkkhaki: 'bdb76b',
  darkmagenta: '8b008b',
  darkolivegreen: '556b2f',
  darkorange: 'ff8c00',
  darkorchid: '9932cc',
  darkred: '8b0000',
  darksalmon: 'e9967a',
  darkseagreen: '8fbc8f',
  darkslateblue: '483d8b',
  darkslategray: '2f4f4f',
  darkslategrey: '2f4f4f',
  darkturquoise: '00ced1',
  darkviolet: '9400d3',
  deeppink: 'ff1493',
  deepskyblue: '00bfff',
  dimgray: '696969',
  dimgrey: '696969',
  dodgerblue: '1e90ff',
  firebrick: 'b22222',
  floralwhite: 'fffaf0',
  forestgreen: '228b22',
  fuchsia: 'f0f',
  gainsboro: 'dcdcdc',
  ghostwhite: 'f8f8ff',
  gold: 'ffd700',
  goldenrod: 'daa520',
  gray: '808080',
  green: '008000',
  greenyellow: 'adff2f',
  grey: '808080',
  honeydew: 'f0fff0',
  hotpink: 'ff69b4',
  indianred: 'cd5c5c',
  indigo: '4b0082',
  ivory: 'fffff0',
  khaki: 'f0e68c',
  lavender: 'e6e6fa',
  lavenderblush: 'fff0f5',
  lawngreen: '7cfc00',
  lemonchiffon: 'fffacd',
  lightblue: 'add8e6',
  lightcoral: 'f08080',
  lightcyan: 'e0ffff',
  lightgoldenrodyellow: 'fafad2',
  lightgray: 'd3d3d3',
  lightgreen: '90ee90',
  lightgrey: 'd3d3d3',
  lightpink: 'ffb6c1',
  lightsalmon: 'ffa07a',
  lightseagreen: '20b2aa',
  lightskyblue: '87cefa',
  lightslategray: '789',
  lightslategrey: '789',
  lightsteelblue: 'b0c4de',
  lightyellow: 'ffffe0',
  lime: '0f0',
  limegreen: '32cd32',
  linen: 'faf0e6',
  magenta: 'f0f',
  maroon: '800000',
  mediumaquamarine: '66cdaa',
  mediumblue: '0000cd',
  mediumorchid: 'ba55d3',
  mediumpurple: '9370db',
  mediumseagreen: '3cb371',
  mediumslateblue: '7b68ee',
  mediumspringgreen: '00fa9a',
  mediumturquoise: '48d1cc',
  mediumvioletred: 'c71585',
  midnightblue: '191970',
  mintcream: 'f5fffa',
  mistyrose: 'ffe4e1',
  moccasin: 'ffe4b5',
  navajowhite: 'ffdead',
  navy: '000080',
  oldlace: 'fdf5e6',
  olive: '808000',
  olivedrab: '6b8e23',
  orange: 'ffa500',
  orangered: 'ff4500',
  orchid: 'da70d6',
  palegoldenrod: 'eee8aa',
  palegreen: '98fb98',
  paleturquoise: 'afeeee',
  palevioletred: 'db7093',
  papayawhip: 'ffefd5',
  peachpuff: 'ffdab9',
  peru: 'cd853f',
  pink: 'ffc0cb',
  plum: 'dda0dd',
  powderblue: 'b0e0e6',
  purple: '800080',
  rebeccapurple: '663399',
  red: 'f00',
  rosybrown: 'bc8f8f',
  royalblue: '4169e1',
  saddlebrown: '8b4513',
  salmon: 'fa8072',
  sandybrown: 'f4a460',
  seagreen: '2e8b57',
  seashell: 'fff5ee',
  sienna: 'a0522d',
  silver: 'c0c0c0',
  skyblue: '87ceeb',
  slateblue: '6a5acd',
  slategray: '708090',
  slategrey: '708090',
  snow: 'fffafa',
  springgreen: '00ff7f',
  steelblue: '4682b4',
  tan: 'd2b48c',
  teal: '008080',
  thistle: 'd8bfd8',
  tomato: 'ff6347',
  turquoise: '40e0d0',
  violet: 'ee82ee',
  wheat: 'f5deb3',
  white: 'fff',
  whitesmoke: 'f5f5f5',
  yellow: 'ff0',
  yellowgreen: '9acd32'
}
