import 'mocha';
import { assert } from 'chai';

import webcolor from '../webcolor.js';

describe('webcolor constructor', () => {
  it('should be a function', () => {
    assert.isFunction(webcolor);
  });

  it('should read and return an rgb color', () => {
    const expected = 'rgb(0,0,0)';
    const actual = webcolor('black').toString();
    assert.equal(actual, expected);
  });

  it('should parse a color from hex string', () => {
    const hexcolors = [
      "#43C403",
      "#43C40399",
      "#F3A",
      "#F3A9"
    ]
    const rgbvalues = [
      {r: 67, g: 196, b: 3, a: 1},
      {r: 67, g: 196, b: 3, a: .6},
      {r: 255, g: 51, b: 170, a: 1},
      {r: 255, g: 51, b: 170, a: .6}
    ]
    hexcolors.forEach((c, i) => {
      c = webcolor(c);
      assert.equal(c.r, rgbvalues[i].r)
      assert.equal(c.g, rgbvalues[i].g)
      assert.equal(c.b, rgbvalues[i].b)
      assert.equal(c.a, rgbvalues[i].a)
    })
  });
});

describe('find contrasting color', () => {
  it('should return black for light color', () => {
    const expected = 'rgb(0,0,0)';
    const actual = webcolor('#ccc').contrastingColor().toString();
    assert.equal(actual, expected);
  });
  it('should return white for dark color', () => {
    const expected = 'rgb(255,255,255)';
    const actual = webcolor('#333').contrastingColor().toString();
    assert.equal(actual, expected);
  });
  it('should return a lighter color if the target color is lighter', () => {
    const expected = 'rgb(162,162,162)';
    const basecolor = webcolor('#333');
    const cc = basecolor.contrastingColor('#444')
    assert.equal(cc.toString(), expected);
    assert.isAtLeast(basecolor.contrastRatio(cc), 4.5)
  });
  it('should return a darker color if the target color is darker', () => {
    const expected = 'rgb(78,78,78)';
    const basecolor = webcolor('#ccc');
    const cc = basecolor.contrastingColor('#aaa')
    assert.equal(cc.toString(), expected);
    assert.isAtLeast(basecolor.contrastRatio(cc), 4.5)
  });
  it('should return a darker color if the target color is lighter but too close to white', () => {
    const expected = 'rgb(75,75,75)';
    const basecolor = webcolor('#bbb');
    const cc = basecolor.contrastingColor('#ccc')
    assert.equal(cc.toString(), expected);
    assert.isAtLeast(basecolor.contrastRatio(cc), 4.5)
  });
  it('should return a lighter color if the target color is darker but too close to black', () => {
    const expected = 'rgb(180,180,180)';
    const basecolor = webcolor('#444');
    const cc = basecolor.contrastingColor('#222')
    assert.equal(cc.toString(), expected);
    assert.isAtLeast(basecolor.contrastRatio(cc), 4.5)
  });
  it('should return a darker color if both given colors are equal and light', () => {
    const expected = 'rgb(97,97,97)';
    const basecolor = webcolor('#eee');
    const cc = basecolor.contrastingColor('#eee')
    assert.equal(cc.toString(), expected);
    assert.isAtLeast(basecolor.contrastRatio(cc), 4.5)
  });
});
