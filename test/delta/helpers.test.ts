import { beforeEach, describe, expect, it, vi } from 'vitest';
import Delta from '../../src/Delta.js';

describe('helpers', () => {
  describe('concat()', () => {
    it('empty delta', () => {
      const delta = new Delta().insert('Test');
      const concat = new Delta();
      const expected = new Delta().insert('Test');
      expect(delta.concat(concat)).toEqual(expected);
    });

    it('unmergeable', () => {
      const delta = new Delta().insert('Test');
      const original = new Delta(JSON.parse(JSON.stringify(delta)));
      const concat = new Delta().insert('!', { bold: true });
      const expected = new Delta().insert('Test').insert('!', { bold: true });
      expect(delta.concat(concat)).toEqual(expected);
      expect(delta).toEqual(original);
    });

    it('mergeable', () => {
      const delta = new Delta().insert('Test', { bold: true });
      const original = new Delta(JSON.parse(JSON.stringify(delta)));
      const concat = new Delta().insert('!', { bold: true }).insert('\n');
      const expected = new Delta().insert('Test!', { bold: true }).insert('\n');
      expect(delta.concat(concat)).toEqual(expected);
      expect(delta).toEqual(original);
    });
  });

  describe('chop()', () => {
    it('retain', () => {
      const delta = new Delta().insert('Test').retain(4);
      const expected = new Delta().insert('Test');
      expect(delta.chop()).toEqual(expected);
    });

    it('insert', () => {
      const delta = new Delta().insert('Test');
      const expected = new Delta().insert('Test');
      expect(delta.chop()).toEqual(expected);
    });

    it('formatted retain', () => {
      const delta = new Delta().insert('Test').retain(4, { bold: true });
      const expected = new Delta().insert('Test').retain(4, { bold: true });
      expect(delta.chop()).toEqual(expected);
    });
  });

  describe('eachLine()', () => {
    const spy = { predicate: () => {} };

    beforeEach(() => {
      vi.resetAllMocks();
      vi.spyOn(spy, 'predicate');
    });

    it('expected', () => {
      const delta = new Delta()
        .insert('Hello\n\n')
        .insert('World', { bold: true })
        .insert({ image: 'octocat.png' })
        .insert('\n', { align: 'right' })
        .insert('!');
      delta.eachLine(spy.predicate);
      expect(spy.predicate).toHaveBeenCalledTimes(4);
      expect(spy.predicate).nthCalledWith(1, new Delta().insert('Hello'), {}, 0);
      expect(spy.predicate).nthCalledWith(2, new Delta(), {}, 1);
      expect(spy.predicate).nthCalledWith(
        3,
        new Delta().insert('World', { bold: true }).insert({ image: 'octocat.png' }),
        { align: 'right' },
        2
      );
      expect(spy.predicate).nthCalledWith(4, new Delta().insert('!'), {}, 3);
    });

    it('trailing newline', () => {
      const delta = new Delta().insert('Hello\nWorld!\n');
      delta.eachLine(spy.predicate);
      expect(spy.predicate).toBeCalledTimes(2);
      expect(spy.predicate).nthCalledWith(1, new Delta().insert('Hello'), {}, 0);
      expect(spy.predicate).nthCalledWith(2, new Delta().insert('World!'), {}, 1);
    });

    it('non-document', () => {
      const delta = new Delta().retain(1).delete(2);
      delta.eachLine(spy.predicate);
      expect(spy.predicate).toBeCalledTimes(0);
    });

    it('early return', () => {
      const delta = new Delta().insert('Hello\nNew\nWorld!');
      let count = 0;
      const spy = {
        predicate: () => {
          if (count === 1) return false;
          count += 1;
        },
      };
      vi.spyOn(spy, 'predicate');
      delta.eachLine(spy.predicate);
      expect(spy.predicate).toBeCalledTimes(2);
    });
  });

  describe('iteration', () => {
    let delta: Delta;

    beforeEach(() => {
      delta = new Delta().insert('Hello').insert({ image: true }).insert('World!');
    });

    it('filter()', () => {
      const arr = delta.filter(function (op) {
        return typeof op.insert === 'string';
      });
      expect(arr.length).toEqual(2);
    });

    it('forEach()', () => {
      const spy = { predicate: () => {} };
      vi.spyOn(spy, 'predicate');
      delta.forEach(spy.predicate);
      expect(spy.predicate).toBeCalledTimes(3);
    });

    it('map()', () => {
      const arr = delta.map(function (op) {
        return typeof op.insert === 'string' ? op.insert : '';
      });
      expect(arr).toEqual(['Hello', '', 'World!']);
    });

    it('partition()', () => {
      const arr = delta.partition(function (op) {
        return typeof op.insert === 'string';
      });
      const passed = arr[0],
        failed = arr[1];
      expect(passed).toEqual([delta.ops[0], delta.ops[2]]);
      expect(failed).toEqual([delta.ops[1]]);
    });
  });

  describe('length()', () => {
    it('document', () => {
      const delta = new Delta().insert('AB', { bold: true }).insert('1');
      expect(delta.length()).toEqual(3);
    });

    it('mixed', () => {
      const delta = new Delta().insert('AB', { bold: true }).insert('1').retain(2, { bold: null }).delete(1);
      expect(delta.length()).toEqual(6);
    });
  });

  describe('changeLength()', () => {
    it('mixed', () => {
      const delta = new Delta().insert('AB', { bold: true }).retain(2, { bold: null }).delete(1);
      expect(delta.changeLength()).toEqual(1);
    });
  });

  describe('slice()', () => {
    it('start', () => {
      const slice = new Delta().retain(2).insert('A').slice(2);
      const expected = new Delta().insert('A');
      expect(slice).toEqual(expected);
    });

    it('start and end chop', () => {
      const slice = new Delta().insert('0123456789').slice(2, 7);
      const expected = new Delta().insert('23456');
      expect(slice).toEqual(expected);
    });

    it('start and end multiple chop', () => {
      const slice = new Delta().insert('0123', { bold: true }).insert('4567').slice(3, 5);
      const expected = new Delta().insert('3', { bold: true }).insert('4');
      expect(slice).toEqual(expected);
    });

    it('start and end', () => {
      const slice = new Delta().retain(2).insert('A', { bold: true }).insert('B').slice(2, 3);
      const expected = new Delta().insert('A', { bold: true });
      expect(slice).toEqual(expected);
    });

    it('no params', () => {
      const delta = new Delta().retain(2).insert('A', { bold: true }).insert('B');
      const slice = delta.slice();
      expect(slice).toEqual(delta);
    });

    it('split ops', () => {
      const slice = new Delta().insert('AB', { bold: true }).insert('C').slice(1, 2);
      const expected = new Delta().insert('B', { bold: true });
      expect(slice).toEqual(expected);
    });

    it('split ops multiple times', () => {
      const slice = new Delta().insert('ABC', { bold: true }).insert('D').slice(1, 2);
      const expected = new Delta().insert('B', { bold: true });
      expect(slice).toEqual(expected);
    });
  });
});
