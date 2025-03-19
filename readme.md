# arvarus's basic rules engine

This is a basic rules engine that can be used to evaluate rules and set a result.

## Golden rules

- The evaluate function must return a boolean
- The evaluate function must not change the context
- The evaluate function must not change the results

- The action function must not change the context
- The action function must not change the results
- The action function must return a partial result

- The rules are evaluated in the order they are added
- The rules are evaluated until the first rule that returns true

## Usage

```javascript
const ruleEngine = new RuleEngine(context, rules, initialResult);

await ruleEngine.run()

console.log(ruleEngine.getResult());
```

## Example

```javascript
import RuleEngine from '@arvarus/basic-rules-engine';

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

const ruleEngine = new RuleEngine(context, rules, initialResult);

await ruleEngine.run()

console.log(ruleEngine.getResult());
// { count: 3, flag: true }
```

## Next Steps

- Add examples
- Add documentation
- Handle errors in evaluation or actions

## History

- 2.0.x: (Breaking change)
  - run function now returns the result
- 1.0.x: Initial version
```
