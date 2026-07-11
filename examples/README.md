# Examples

Runnable examples for `@arvarus/basic-rules-engine`.

These files import the compiled engine from `../bin`, so build the project first:

```bash
npm install
npm run compile
```

Then run any example with Node:

```bash
node examples/01-counter.js
node examples/02-shopping-cart.js
node examples/03-approval-workflow.js
```

| Example | Demonstrates |
|---|---|
| [01-counter.js](01-counter.js) | The basics: context, rules, result merging |
| [02-shopping-cart.js](02-shopping-cart.js) | Business rules: ordered pricing/discount rules |
| [03-approval-workflow.js](03-approval-workflow.js) | `swapBuffer` (per-rule mutable storage) and `maxIterations` |

> This folder is not included in the published npm package.
