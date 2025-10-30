# arvarus's basic rules engine

A powerful, type-safe rules engine for TypeScript/JavaScript with comprehensive error handling, execution hooks, and debugging capabilities.

## Features

- ✅ **Type-safe**: Full TypeScript support with generics
- ✅ **Error Handling**: Comprehensive error handling with detailed error messages
- ✅ **Execution Hooks**: Before/after rule execution hooks for extensibility
- ✅ **Statistics**: Collect detailed execution statistics and performance metrics
- ✅ **Debug Mode**: Built-in debugging with detailed logging
- ✅ **Resilient**: Optional continue-on-error mode
- ✅ **Immutable Context**: Context is frozen to prevent accidental mutations
- ✅ **Swap Buffers**: Store intermediate values within rules

## Golden Rules

- The `evaluate` function must return a boolean
- The `evaluate` function must not change the context
- The `evaluate` function must not change the results

- The `action` function must not change the context
- The `action` function must not change the results
- The `action` function must return a partial result

- Rules are evaluated in the order they are added
- Rules are evaluated until the first rule that returns true
- The selected rule's action is executed, then evaluation starts over

## Installation

```bash
npm install @arvarus/basic-rules-engine
```

## Basic Usage

```typescript
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

const result = await ruleEngine.run();

console.log(result);
// { count: 3, flag: true }
```

## Advanced Features

### Error Handling

The engine provides detailed error messages that include the rule name:

```typescript
const rules = [
  {
    name: 'Risky Rule',
    evaluate: async () => {
      throw new Error('Something went wrong');
    },
    action: async () => ({}),
  },
];

try {
  await engine.run();
} catch (error) {
  console.error(error.message);
  // Output: Error evaluating rule "Risky Rule": Something went wrong
}
```

### Continue on Error

You can configure the engine to continue execution even if a rule fails:

```typescript
await engine.run({
  continueOnError: true,
  onError: async (error, rule, context, result, phase) => {
    console.error(`Error in ${phase} of ${rule.name}:`, error.message);
  },
});
```

### Execution Hooks

Use hooks to monitor or extend rule execution:

```typescript
await engine.run({
  beforeRule: async (rule, context, result) => {
    console.log(`About to execute: ${rule.name}`);
  },
  afterRule: async (rule, context, result, updates) => {
    console.log(`Completed: ${rule.name}`, updates);
  },
});
```

### Execution Statistics

Collect detailed performance metrics:

```typescript
await engine.run({ collectStats: true });

const stats = engine.getStatistics();
console.log(`Total iterations: ${stats.totalIterations}`);
console.log(`Total time: ${stats.totalTimeMs.toFixed(2)}ms`);

stats.ruleStats.forEach((stat) => {
  console.log(`Rule "${stat.ruleName}":`);
  console.log(`  - Evaluated ${stat.evaluationCount} times`);
  console.log(`  - Executed ${stat.executionCount} times`);
  console.log(`  - Avg evaluation time: ${(stat.evaluationTimeMs / stat.evaluationCount).toFixed(2)}ms`);
});
```

### Debug Mode

Enable debug logging to see detailed execution flow:

```typescript
await engine.run({ debug: true });

// Output:
// [RuleEngine] Starting execution with 3 rules
// [RuleEngine] Evaluated "Init result": true
// [RuleEngine] Executing "Init result" (iteration 1)
// [RuleEngine] "Init result" updated result: { count: 0, flag: false }
// ...
```

### Swap Buffers

Use swap buffers to store intermediate values within a rule:

```typescript
interface MyBuffer {
  tempValue: number;
}

const rules = [
  {
    name: 'Calculate with buffer',
    swapBuffer: {} as MyBuffer,
    evaluate: async function (context, result) {
      this.swapBuffer.tempValue = context.value * 2;
      return true;
    },
    action: async function () {
      return { result: this.swapBuffer.tempValue };
    },
  },
];
```

## API Reference

### RuleEngine Constructor

```typescript
new RuleEngine<Context, Result>(
  context: Context,
  rules?: Array<Rule<Context, Result>>,
  initialResult?: Result
)
```

### Methods

- **`setRules(rules: Array<Rule>)`**: Set or update the rules
- **`setInitialResult(result: Result)`**: Set the initial result
- **`getResult()`**: Get the current result
- **`run(options?: RunOptions)`**: Execute the rules engine
- **`getStatistics()`**: Get execution statistics (only available if `collectStats` was enabled)

### RunOptions

```typescript
interface RunOptions {
  maxIterations?: number;       // Default: 1000
  debug?: boolean;              // Default: false
  collectStats?: boolean;       // Default: false
  continueOnError?: boolean;    // Default: false
  beforeRule?: BeforeRuleHook;
  afterRule?: AfterRuleHook;
  onError?: ErrorHook;
}
```

## TypeScript Support

The engine is fully typed with generics:

```typescript
interface MyContext {
  userId: string;
  permissions: string[];
}

interface MyResult {
  canAccess: boolean;
  reason?: string;
}

const engine = new RuleEngine<MyContext, MyResult>(context, rules);
```

## History

- **2.1.x**: Enhanced features
  - Added comprehensive error handling with rule names
  - Added execution hooks (beforeRule, afterRule, onError)
  - Added execution statistics collection
  - Added debug mode with detailed logging
  - Added continueOnError option
  - Improved error messages
  - Full JSDoc documentation
- **2.0.x**: (Breaking change)
  - run function now returns the result
- **1.0.x**: Initial version

## License

GPL-3.0-only
