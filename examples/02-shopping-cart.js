/*
 * Business-rules example: price a shopping cart.
 *
 * Each rule guards on what is already computed in the result, so every rule
 * fires exactly once and the order of computation is explicit:
 * subtotal -> bulk discount -> loyalty discount -> total.
 */
import Engine from '../bin/index.js';

const context = {
  items: [
    { name: 'Keyboard', price: 45, quantity: 2 },
    { name: 'Monitor', price: 180, quantity: 1 },
    { name: 'Cable', price: 8, quantity: 5 },
  ],
  loyaltyMember: true,
};

const rules = [
  {
    name: 'Compute subtotal',
    evaluate: async (context, result) => result.subtotal === undefined,
    action: async (context) => ({
      subtotal: context.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
  },
  {
    name: 'Bulk discount: 10 % off orders of 100 or more',
    evaluate: async (context, result) =>
      result.subtotal !== undefined && result.discountPercent === undefined,
    action: async (context, result) => ({
      discountPercent: result.subtotal >= 100 ? 10 : 0,
    }),
  },
  {
    name: 'Loyalty discount: extra 5 % for members',
    evaluate: async (context, result) =>
      result.discountPercent !== undefined && result.loyaltyApplied === undefined,
    action: async (context, result) => ({
      discountPercent: result.discountPercent + (context.loyaltyMember ? 5 : 0),
      loyaltyApplied: true,
    }),
  },
  {
    name: 'Compute total',
    evaluate: async (context, result) => result.loyaltyApplied && result.total === undefined,
    action: async (context, result) => ({
      total: Math.round(result.subtotal * (1 - result.discountPercent / 100) * 100) / 100,
    }),
  },
];

const engine = new Engine(context, rules);
const result = await engine.run();

console.log(result);
// { subtotal: 310, discountPercent: 15, loyaltyApplied: true, total: 263.5 }
