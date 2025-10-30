/*
 * Copyright (C) 2025 - PPRB
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
import { Rule, Context, Result, SwapBuffer, RuleEngine } from './types';
import Engine from './engine';

// Define test-specific interfaces
interface TestContext extends Context {
  startValue: number;
  endValue: number;
}

interface TestResult extends Result {
  count: number;
  flag: boolean;
}

type EngineWithPrivates = RuleEngine<TestContext, TestResult> & {
  context: TestContext;
  result: TestResult;
  rules: Array<Rule<TestContext, TestResult>>;
};

describe('Engine', () => {
  // Setup test variables
  let initialContext: TestContext;
  let rules: Array<Rule<TestContext, TestResult>>;
  let initialResult: Partial<TestResult>;

  beforeEach(() => {
    // Setup initial test data
    initialContext = { startValue: 0, endValue: 3 };
    initialResult = {};

    // Define rules for testing
    rules = [
      {
        name: 'Init result',
        evaluate: async (context, result): Promise<boolean> => result.count == undefined,
        action: async (context): Promise<Partial<TestResult>> =>
          Promise.resolve({ count: context.startValue, flag: false }),
      },
      {
        name: 'Increment count when less than 3',
        evaluate: async (context, result): Promise<boolean> =>
          Promise.resolve(result.flag !== true && (result.count ?? 0) < context.endValue),
        action: async (context, result): Promise<Partial<TestResult>> =>
          Promise.resolve({ count: (result.count ?? 0) + 1 }),
      },
      {
        name: 'Set flag when count equals 3',
        evaluate: async (context, result): Promise<boolean> =>
          Promise.resolve(result.count === context.endValue && !result.flag),
        action: async (): Promise<Partial<TestResult>> => Promise.resolve({ flag: true }),
      },
    ];
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with provided context, rules, and result', () => {
    const engine = new Engine(initialContext, rules, initialResult);
    expect((engine as EngineWithPrivates).context).toEqual(initialContext);
    expect((engine as EngineWithPrivates).rules).toEqual(rules);
    expect((engine as EngineWithPrivates).result).toEqual(initialResult);
  });

  it('should initialize with empty values when not provided', () => {
    const emptyEngine = new Engine(null as any);
    expect((emptyEngine as EngineWithPrivates).context).toEqual({});
    expect((emptyEngine as EngineWithPrivates).rules).toEqual([]);
    expect((emptyEngine as EngineWithPrivates).result).toEqual({});
  });

  it('should set initial result with setInitialResult', () => {
    const engine = new Engine(initialContext, rules, initialResult);
    const newResult = { count: 10 };
    engine.setInitialResult(newResult);
    expect(engine.getResult()).toEqual(newResult);
  });

  it('should update rules with setRules', () => {
    const engine = new Engine(initialContext, rules, initialResult);
    const newRules: Array<Rule<TestContext>> = [
      {
        evaluate: () => Promise.resolve(true),
        action: () => Promise.resolve({}),
      },
    ];
    engine.setRules(newRules);
    expect((engine as EngineWithPrivates).rules).toEqual(newRules);
  });

  it('should return the result with getResult', () => {
    const engine = new Engine(initialContext, rules, initialResult);
    expect(engine.getResult()).toEqual(initialResult);
  });

  it('should execute rules until no rule evaluates to true', async () => {
    const engine = new Engine(initialContext, rules, initialResult);
    await engine.run();
    const result = engine.getResult();

    // After running, count should be 3 and flag should be true
    expect(result.count).toBe(3);
    expect(result.flag).toBe(true);
  });

  it('should maintain method chaining', () => {
    const newRules: Array<Rule<TestContext>> = [];

    const engine = new Engine(initialContext);

    const returnedEngine = engine.setRules(newRules).setInitialResult(initialResult);

    expect(returnedEngine).toBe(engine);
  });

  it('should stop when no rules evaluate to true', async () => {
    // Set initial context to a state where no rules will match
    const engine = new Engine({ startValue: 1, endValue: 0 }, rules, initialResult);
    await engine.run();
    const result = engine.getResult();

    // Context should remain unchanged
    expect(result.count).toBe(1);
  });

  it('should throw an error when maximum iterations is exceeded', async () => {
    const engine = new Engine(initialContext, rules, initialResult);
    await expect(engine.run({ maxIterations: 1 })).rejects.toThrow(
      'Rule engine exceeded maximum number of iterations (1). This may indicate an infinite loop.',
    );
  });

  it('should use swapbuffer to store intermediate values', async () => {
    interface TestBuffer extends SwapBuffer {
      temp: number;
    }

    const rulesWithSwapBuffer: Array<Rule<TestContext, TestResult, Partial<TestBuffer>>> = [
      {
        name: 'Test Swap Buffer',
        swapBuffer: {},
        evaluate: async function (context, result): Promise<boolean> {
          if (this.swapBuffer) {
            this.swapBuffer.temp = 42;
          } else {
            this.swapBuffer = { temp: 42 };
          }
          return Promise.resolve(result.count === undefined);
        },
        action: async function (): Promise<Partial<TestResult>> {
          return { count: this.swapBuffer?.temp };
        },
      },
    ];

    const engine = new Engine({ startValue: 0, endValue: 0 }, rulesWithSwapBuffer, initialResult);
    await engine.run();
    const result = engine.getResult();

    // Context should remain unchanged
    expect(result.count).toBe(42);
  });

  describe('Error Handling', () => {
    it('should throw error with rule name when evaluation fails', async () => {
      const rulesWithError: Array<Rule<TestContext, TestResult>> = [
        {
          name: 'Failing Rule',
          evaluate: async (): Promise<boolean> => {
            throw new Error('Evaluation error');
          },
          action: async (): Promise<Partial<TestResult>> => Promise.resolve({}),
        },
      ];

      const engine = new Engine(initialContext, rulesWithError, initialResult);
      await expect(engine.run()).rejects.toThrow('Error evaluating rule "Failing Rule"');
    });

    it('should throw error with rule name when action fails', async () => {
      const rulesWithError: Array<Rule<TestContext, TestResult>> = [
        {
          name: 'Failing Action Rule',
          evaluate: async (): Promise<boolean> => Promise.resolve(true),
          action: async (): Promise<Partial<TestResult>> => {
            throw new Error('Action error');
          },
        },
      ];

      const engine = new Engine(initialContext, rulesWithError, initialResult);
      await expect(engine.run()).rejects.toThrow('Error executing rule "Failing Action Rule"');
    });

    it('should continue execution when continueOnError is true', async () => {
      let actionCalled = false;
      const rulesWithError: Array<Rule<TestContext, TestResult>> = [
        {
          name: 'Failing Rule',
          evaluate: async (): Promise<boolean> => {
            throw new Error('Evaluation error');
          },
          action: async (): Promise<Partial<TestResult>> => Promise.resolve({}),
        },
        {
          name: 'Working Rule',
          evaluate: async (_context, result): Promise<boolean> =>
            Promise.resolve(result.count === undefined),
          action: async (): Promise<Partial<TestResult>> => {
            actionCalled = true;
            return Promise.resolve({ count: 100 });
          },
        },
      ];

      const engine = new Engine(initialContext, rulesWithError, initialResult);
      await engine.run({ continueOnError: true });
      expect(actionCalled).toBe(true);
      expect(engine.getResult().count).toBe(100);
    });

    it('should call onError hook when error occurs', async () => {
      const errors: Array<{ phase: string; message: string }> = [];

      const rulesWithError: Array<Rule<TestContext, TestResult>> = [
        {
          name: 'Error in Evaluate',
          evaluate: async (): Promise<boolean> => {
            throw new Error('Eval error');
          },
          action: async (): Promise<Partial<TestResult>> => Promise.resolve({}),
        },
      ];

      const engine = new Engine(initialContext, rulesWithError, initialResult);
      await engine.run({
        continueOnError: true,
        onError: async (error, _rule, _context, _result, phase): Promise<void> => {
          errors.push({ phase, message: error.message });
        },
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].phase).toBe('evaluate');
      expect(errors[0].message).toContain('Error in Evaluate');
    });
  });

  describe('Execution Hooks', () => {
    it('should call beforeRule and afterRule hooks', async () => {
      const hookCalls: Array<string> = [];

      const testRules: Array<Rule<TestContext, TestResult>> = [
        {
          name: 'Test Rule',
          evaluate: async (_context, result): Promise<boolean> =>
            Promise.resolve(result.count === undefined),
          action: async (): Promise<Partial<TestResult>> => Promise.resolve({ count: 1 }),
        },
      ];

      const engine = new Engine(initialContext, testRules, initialResult);
      await engine.run({
        beforeRule: async (rule): Promise<void> => {
          hookCalls.push(`before:${rule.name}`);
        },
        afterRule: async (rule): Promise<void> => {
          hookCalls.push(`after:${rule.name}`);
        },
      });

      expect(hookCalls).toEqual(['before:Test Rule', 'after:Test Rule']);
    });

    it('should pass correct parameters to afterRule hook', async () => {
      let capturedUpdates: Partial<TestResult> | undefined;

      const testRules: Array<Rule<TestContext, TestResult>> = [
        {
          name: 'Test Rule',
          evaluate: async (_context, result): Promise<boolean> =>
            Promise.resolve(result.count === undefined),
          action: async (): Promise<Partial<TestResult>> => Promise.resolve({ count: 42 }),
        },
      ];

      const engine = new Engine(initialContext, testRules, initialResult);
      await engine.run({
        afterRule: async (_rule, _context, _result, updates): Promise<void> => {
          capturedUpdates = updates;
        },
      });

      expect(capturedUpdates).toEqual({ count: 42 });
    });
  });

  describe('Statistics Collection', () => {
    it('should collect execution statistics when enabled', async () => {
      const engine = new Engine(initialContext, rules, initialResult);
      await engine.run({ collectStats: true });

      const stats = engine.getStatistics();
      expect(stats).toBeDefined();
      expect(stats!.totalIterations).toBe(5); // Init, 3 increments, flag set
      expect(stats!.totalTimeMs).toBeGreaterThan(0);
      expect(stats!.ruleStats.size).toBe(3);
    });

    it('should track rule-specific statistics', async () => {
      const engine = new Engine(initialContext, rules, initialResult);
      await engine.run({ collectStats: true });

      const stats = engine.getStatistics();
      const initRuleStats = stats!.ruleStats.get('Init result');

      expect(initRuleStats).toBeDefined();
      expect(initRuleStats!.evaluationCount).toBeGreaterThan(0);
      expect(initRuleStats!.executionCount).toBe(1);
      expect(initRuleStats!.evaluationTimeMs).toBeGreaterThanOrEqual(0);
      expect(initRuleStats!.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should not collect statistics when disabled', async () => {
      const engine = new Engine(initialContext, rules, initialResult);
      await engine.run({ collectStats: false });

      const stats = engine.getStatistics();
      expect(stats).toBeUndefined();
    });
  });

  describe('Debug Mode', () => {
    it('should log execution when debug is enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const engine = new Engine(initialContext, rules, initialResult);
      await engine.run({ debug: true });

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('[RuleEngine] Starting execution with', 3, 'rules');

      consoleSpy.mockRestore();
    });
  });

  describe('Rule Names', () => {
    it('should use default names for unnamed rules', async () => {
      const unnamedRules: Array<Rule<TestContext, TestResult>> = [
        {
          evaluate: async (): Promise<boolean> => {
            throw new Error('Test error');
          },
          action: async (): Promise<Partial<TestResult>> => Promise.resolve({}),
        },
      ];

      const engine = new Engine(initialContext, unnamedRules, initialResult);
      await expect(engine.run()).rejects.toThrow('Error evaluating rule "Rule #1"');
    });
  });

  describe('Improved Error Messages', () => {
    it('should provide better error message for max iterations', async () => {
      const infiniteRules: Array<Rule<TestContext, TestResult>> = [
        {
          name: 'Infinite Rule',
          evaluate: async (): Promise<boolean> => Promise.resolve(true),
          action: async (): Promise<Partial<TestResult>> => Promise.resolve({}),
        },
      ];

      const engine = new Engine(initialContext, infiniteRules, initialResult);
      await expect(engine.run({ maxIterations: 5 })).rejects.toThrow(
        'Rule engine exceeded maximum number of iterations (5). This may indicate an infinite loop.',
      );
    });
  });
});
