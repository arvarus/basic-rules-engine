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

// inspired by deep-freeze-strict (MIT)
function deepFreeze<T>(o: T): T {
  Object.freeze(o);
  const isFunc = typeof o === 'function';
  const skip = new Set(['caller', 'callee', 'arguments']);
  for (const prop of Object.getOwnPropertyNames(o)) {
    if (isFunc && skip.has(prop)) continue;
    const val = (o as Record<string, unknown>)[prop];
    if (
      val !== null &&
      (typeof val === 'object' || typeof val === 'function') &&
      !Object.isFrozen(val)
    ) {
      deepFreeze(val);
    }
  }
  return o;
}

export default deepFreeze;
