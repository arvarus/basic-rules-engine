/*
 * Workflow example: a document goes draft -> in-review -> approved.
 *
 * Demonstrates:
 * - `swapBuffer`: mutable storage local to a rule, shared between its
 *   `evaluate` and `action` (use a regular `function` to access `this`).
 * - `maxIterations`: a safety net against rules that never stop matching.
 */
import Engine from '../bin/index.js';

const context = {
  reviewers: ['alice', 'bob'],
  requiredApprovals: 2,
};

const rules = [
  {
    name: 'Init document',
    evaluate: async (context, result) => result.status === undefined,
    action: async () => ({ status: 'draft', approvals: [] }),
  },
  {
    name: 'Submit for review',
    evaluate: async (context, result) => result.status === 'draft',
    action: async () => ({ status: 'in-review' }),
  },
  {
    name: 'Collect next approval',
    swapBuffer: {},
    evaluate: async function (context, result) {
      if (result.status !== 'in-review') return false;
      // pick the next reviewer and stash it for the action
      this.swapBuffer.nextReviewer = context.reviewers[result.approvals.length];
      return result.approvals.length < context.requiredApprovals;
    },
    action: async function (context, result) {
      return { approvals: [...result.approvals, this.swapBuffer.nextReviewer] };
    },
  },
  {
    name: 'Approve document',
    evaluate: async (context, result) =>
      result.status === 'in-review' && result.approvals.length >= context.requiredApprovals,
    action: async () => ({ status: 'approved' }),
  },
];

const engine = new Engine(context, rules);

// maxIterations guards against a rule set that never converges
const result = await engine.run({ maxIterations: 10 });

console.log(result);
// { status: 'approved', approvals: [ 'alice', 'bob' ] }
