/*
 * Copyright (C) 2025-26 - PPRB
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import deepFreeze from './deep-freeze';

describe('deepFreeze', () => {
  it('should return the same reference', () => {
    const obj = { a: 1 };
    const result = deepFreeze(obj);
    expect(result).toBe(obj);
  });

  it('should freeze a flat object', () => {
    const obj = deepFreeze({ a: 1, b: 'hello' });
    expect(Object.isFrozen(obj)).toBe(true);
  });

  it('should recursively freeze nested objects', () => {
    const obj = deepFreeze({ a: { b: { c: 42 } } });
    expect(Object.isFrozen(obj)).toBe(true);
    expect(Object.isFrozen(obj.a)).toBe(true);
    expect(Object.isFrozen(obj.a.b)).toBe(true);
  });

  it('should prevent mutation on a flat object', () => {
    const obj = deepFreeze({ a: 1 });
    expect(() => {
      (obj as Record<string, unknown>).a = 2;
    }).toThrow();
  });

  it('should prevent mutation on nested objects', () => {
    const obj = deepFreeze({ nested: { value: 42 } });
    expect(() => {
      (obj.nested as Record<string, unknown>).value = 99;
    }).toThrow();
  });

  it('should not re-process already-frozen objects', () => {
    const inner = Object.freeze({ x: 1 });
    const spy = jest.spyOn(Object, 'freeze');
    deepFreeze({ inner });
    // inner is already frozen — Object.freeze should not be called on it again
    const callArgs = spy.mock.calls.map((call) => call[0]);
    expect(callArgs).not.toContain(inner);
    spy.mockRestore();
  });

  it('should not re-process already-frozen nested objects', () => {
    const deepInner = Object.freeze({ z: 99 });
    const inner = Object.freeze({ deepInner });
    const spy = jest.spyOn(Object, 'freeze');
    deepFreeze({ inner });
    const callArgs = spy.mock.calls.map((call) => call[0]);
    expect(callArgs).not.toContain(inner);
    expect(callArgs).not.toContain(deepInner);
    spy.mockRestore();
  });

  it('should handle functions without throwing', () => {
    const fn = function (): void {
      return undefined;
    };
    expect(() => deepFreeze(fn)).not.toThrow();
    expect(Object.isFrozen(fn)).toBe(true);
  });

  it('should skip caller/callee/arguments properties on functions', () => {
    const fn = function (): void {
      return undefined;
    };
    const callerValue = { secret: true };
    Object.defineProperty(fn, 'caller', { value: callerValue, writable: true, configurable: true });
    deepFreeze(fn);
    // fn itself is frozen, but the 'caller' property value was skipped and must not be frozen
    expect(Object.isFrozen(fn)).toBe(true);
    expect(Object.isFrozen(callerValue)).toBe(false);
  });

  it('should preserve generic typing', () => {
    interface Foo {
      bar: number;
    }
    const obj: Foo = deepFreeze({ bar: 7 });
    expect(obj.bar).toBe(7);
  });

  it('should handle arrays', () => {
    const arr = deepFreeze([1, 2, { x: 3 }]);
    expect(Object.isFrozen(arr)).toBe(true);
    expect(Object.isFrozen(arr[2])).toBe(true);
  });
});
