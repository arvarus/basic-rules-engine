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
const { createRuleEngine } = require('@keud/rules-engine');

const ruleEngine = new RuleEngine();

await ruleEngine
  .setContext(context)
  .setRules(rules)
  .setInitialResults(initialResults)
  .run();

const result = ruleEngine.getResult();
```

## Next Steps

- Add examples
- Add documentation
- Add CI
- Add async execution
- Handle errors in evaluation or actions
- Add a safe mode to prevent infinite loops
- Add a way to stop the execution of the rules
- Prevent the engine to be run multiple times
- Add tempory context ?
- optional arguments in constructor