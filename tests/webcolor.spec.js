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
