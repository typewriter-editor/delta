import { describe, expect, it } from 'vitest';
import Delta from '../../src/Delta';

describe('transform()', () => {
  it('insert + insert', () => {
    const a1 = new Delta().insert('A');
    const b1 = new Delta().insert('B');
    const a2 = new Delta(a1);
    const b2 = new Delta(b1);
    const expected1 = new Delta().retain(1).insert('B');
    const expected2 = new Delta().insert('B');
    expect(a1.transform(b1, true)).toEqual(expected1);
    expect(a2.transform(b2, false)).toEqual(expected2);
  });

  it('insert + retain', () => {
    const a = new Delta().insert('A');
    const b = new Delta().retain(1, { bold: true, color: 'red' });
    const expected = new Delta().retain(1).retain(1, { bold: true, color: 'red' });
    expect(a.transform(b, true)).toEqual(expected);
  });

  it('insert + delete', () => {
    const a = new Delta().insert('A');
    const b = new Delta().delete(1);
    const expected = new Delta().retain(1).delete(1);
    expect(a.transform(b, true)).toEqual(expected);
  });

  it('delete + insert', () => {
    const a = new Delta().delete(1);
    const b = new Delta().insert('B');
    const expected = new Delta().insert('B');
    expect(a.transform(b, true)).toEqual(expected);
  });

  it('delete + retain', () => {
    const a = new Delta().delete(1);
    const b = new Delta().retain(1, { bold: true, color: 'red' });
    const expected = new Delta();
    expect(a.transform(b, true)).toEqual(expected);
  });

  it('delete + delete', () => {
    const a = new Delta().delete(1);
    const b = new Delta().delete(1);
    const expected = new Delta();
    expect(a.transform(b, true)).toEqual(expected);
  });

  it('retain + insert', () => {
    const a = new Delta().retain(1, { color: 'blue' });
    const b = new Delta().insert('B');
    const expected = new Delta().insert('B');
    expect(a.transform(b, true)).toEqual(expected);
  });

  it('retain + retain', () => {
    const a1 = new Delta().retain(1, { color: 'blue' });
    const b1 = new Delta().retain(1, { bold: true, color: 'red' });
    const a2 = new Delta().retain(1, { color: 'blue' });
    const b2 = new Delta().retain(1, { bold: true, color: 'red' });
    const expected1 = new Delta().retain(1, { bold: true });
    const expected2 = new Delta();
    expect(a1.transform(b1, true)).toEqual(expected1);
    expect(b2.transform(a2, true)).toEqual(expected2);
  });

  it('retain + retain without priority', () => {
    const a1 = new Delta().retain(1, { color: 'blue' });
    const b1 = new Delta().retain(1, { bold: true, color: 'red' });
    const a2 = new Delta().retain(1, { color: 'blue' });
    const b2 = new Delta().retain(1, { bold: true, color: 'red' });
    const expected1 = new Delta().retain(1, { bold: true, color: 'red' });
    const expected2 = new Delta().retain(1, { color: 'blue' });
    expect(a1.transform(b1, false)).toEqual(expected1);
    expect(b2.transform(a2, false)).toEqual(expected2);
  });

  it('retain + delete', () => {
    const a = new Delta().retain(1, { color: 'blue' });
    const b = new Delta().delete(1);
    const expected = new Delta().delete(1);
    expect(a.transform(b, true)).toEqual(expected);
  });

  it('alternating edits', () => {
    const a1 = new Delta().retain(2).insert('si').delete(5);
    const b1 = new Delta().retain(1).insert('e').delete(5).retain(1).insert('ow');
    const a2 = new Delta(a1);
    const b2 = new Delta(b1);
    const expected1 = new Delta().retain(1).insert('e').delete(1).retain(2).insert('ow');
    const expected2 = new Delta().retain(2).insert('si').delete(1);
    expect(a1.transform(b1, false)).toEqual(expected1);
    expect(b2.transform(a2, false)).toEqual(expected2);
  });

  it('conflicting appends', () => {
    const a1 = new Delta().retain(3).insert('aa');
    const b1 = new Delta().retain(3).insert('bb');
    const a2 = new Delta(a1);
    const b2 = new Delta(b1);
    const expected1 = new Delta().retain(5).insert('bb');
    const expected2 = new Delta().retain(3).insert('aa');
    expect(a1.transform(b1, true)).toEqual(expected1);
    expect(b2.transform(a2, false)).toEqual(expected2);
  });

  it('prepend + append', () => {
    const a1 = new Delta().insert('aa');
    const b1 = new Delta().retain(3).insert('bb');
    const expected1 = new Delta().retain(5).insert('bb');
    const a2 = new Delta(a1);
    const b2 = new Delta(b1);
    const expected2 = new Delta().insert('aa');
    expect(a1.transform(b1, false)).toEqual(expected1);
    expect(b2.transform(a2, false)).toEqual(expected2);
  });

  it('trailing deletes with differing lengths', () => {
    const a1 = new Delta().retain(2).delete(1);
    const b1 = new Delta().delete(3);
    const expected1 = new Delta().delete(2);
    const a2 = new Delta(a1);
    const b2 = new Delta(b1);
    const expected2 = new Delta();
    expect(a1.transform(b1, false)).toEqual(expected1);
    expect(b2.transform(a2, false)).toEqual(expected2);
  });

  it('immutability', () => {
    const a1 = new Delta().insert('A');
    const a2 = new Delta().insert('A');
    const b1 = new Delta().insert('B');
    const b2 = new Delta().insert('B');
    const expected = new Delta().retain(1).insert('B');
    expect(a1.transform(b1, true)).toEqual(expected);
    expect(a1).toEqual(a2);
    expect(b1).toEqual(b2);
  });
});
