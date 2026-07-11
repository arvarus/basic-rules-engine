/*
 * Basic example: count from startValue to endValue, then set a flag.
 *
 * Shows the core loop of the engine: on each iteration the first rule whose
 * `evaluate` returns true runs its `action`, and the returned partial result
 * is merged into the current result. The engine stops when no rule matches.
 */
import Engine from '../bin/index.js';

const context = { startValue: 0, endValue: 3 };

const rules = [
  {
    name: 'Init result',
    evaluate: async (context, result) => result.count === undefined,
    action: async (context) => ({ count: context.startValue, flag: false }),
  },
  {
    name: 'Increment count while below endValue',
    evaluate: async (context, result) => !result.flag && result.count < context.endValue,
    action: async (context, result) => ({ count: result.count + 1 }),
  },
  {
    name: 'Set flag when endValue is reached',
    evaluate: async (context, result) => result.count === context.endValue && !result.flag,
    action: async () => ({ flag: true }),
  },
];

const engine = new Engine(context, rules);
const result = await engine.run();

console.log(result);
// { count: 3, flag: true }
