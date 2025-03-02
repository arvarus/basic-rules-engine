# arvarus's basic rules engine

This is a basic rules engine that can be used to evaluate rules and set a result.

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