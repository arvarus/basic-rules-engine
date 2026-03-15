# @arvarus/basic-rules-engine

A simple, async rule engine for TypeScript/JavaScript.

## How it works

The engine takes a **context** (immutable, deep-frozen input), a list of **rules**, and an optional initial **result**. On each iteration, it finds the first rule whose `evaluate` function returns `true` and runs its `action`, which returns partial updates merged into the result. This repeats until no rule evaluates to `true`.

## Installation

```bash
npm install @arvarus/basic-rules-engine
```

## Usage

```javascript
const ruleEngine = new Engine(context, rules, initialResult);

await ruleEngine.run();

console.log(ruleEngine.getResult());
```

## Example

```javascript
import Engine from '@arvarus/basic-rules-engine';

const context = { startValue: 0, endValue: 3 };
const initialResult = {};

const rules = [
  {
    name: 'Init result',
    evaluate: async (context, result) => result.count == undefined,
    action: async (context) =>
      Promise.resolve({ count: context.startValue, flag: false }),
  },
  {
    name: 'Increment count when less than 3',
    evaluate: async (context, result) =>
      Promise.resolve(result.flag !== true && (result.count ?? 0) < context.endValue),
    action: async (context, result) =>
      Promise.resolve({ count: (result.count ?? 0) + 1 }),
  },
  {
    name: 'Set flag when count equals 3',
    evaluate: async (context, result) =>
      Promise.resolve(result.count === context.endValue && !result.flag),
    action: async () => Promise.resolve({ flag: true }),
  },
];

const ruleEngine = new Engine(context, rules, initialResult);

await ruleEngine.run();

console.log(ruleEngine.getResult());
// { count: 3, flag: true }
```

## API

### `new Engine(context, rules?, initialResult?)`

| Parameter | Type | Description |
|---|---|---|
| `context` | `object` | Immutable input data (deep-frozen) |
| `rules` | `Rule[]` | Ordered list of rules (default: `[]`) |
| `initialResult` | `object` | Starting result state (default: `{}`) |

### Rule shape

```typescript
{
  name?: string;
  swapBuffer?: object;          // mutable storage local to the rule, shared between evaluate and action
  evaluate: (context, result) => Promise<boolean>;
  action:   (context, result) => Promise<Partial<Result>>;
}
```

### Engine methods

| Method | Description |
|---|---|
| `setRules(rules)` | Replace the rule list (chainable) |
| `setInitialResult(result)` | Set the initial result (chainable) |
| `getResult()` | Return the current result |
| `run(options?)` | Execute rules; resolves with the final result |

### `RunOptions`

| Option | Type | Default | Description |
|---|---|---|---|
| `maxIterations` | `number` | `1000` | Maximum rule evaluations; throws if exceeded (prevents infinite loops) |

## Golden rules

- The `evaluate` function must return a boolean
- The `evaluate` function must not change the context or the result
- The `action` function must not change the context or the result directly — return a partial result instead
- Rules are evaluated in order; the first matching rule runs, then evaluation restarts from the top

## Development

```bash
npm run compile   # compile TypeScript
npm test          # run tests with coverage
npm run lint      # lint
npm run format    # format with Prettier
```

## History

- 2.1.x: `run` now accepts `RunOptions` (`maxIterations`)
- 2.0.x: (Breaking change) `run` now returns the result
- 1.0.x: Initial version

## License

GPL-3.0-only
