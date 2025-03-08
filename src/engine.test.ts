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
import { Rule, Context, Result } from './types';
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

describe('Engine', () => {
  // Setup test variables
  let initialContext: TestContext;
  let rules: Array<Rule<TestContext, TestResult>>;
  let initialResult: Partial<TestResult>;

  beforeEach(() => {
    // Setup initial test data
    initialContext = { startValue: 0, endValue: 3 };
    initialResult = { };

    // Define rules for testing
    rules = [
      {
        name: 'Init result',
        evaluate: (context, result) => result.count == undefined,
        action: (context, result) => ({ count: context.startValue, flag: false }) 
      },
      {
        name: 'Increment count when less than 3',
        evaluate: (context, result) => result.flag !== true && (result.count ?? 0) < context.endValue,
        action: (context, result) => ({ count: (result.count ?? 0) + 1 })
      },
      {
        name: 'Set flag when count equals 3',
        evaluate: (context, result) => result.count === context.endValue && !result.flag,
        action: (context, result) => ({ flag: true })
      }
    ];
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with provided context, rules, and result', () => {
    const engine = new Engine(initialContext, rules, initialResult);
    expect((engine as any).context).toEqual(initialContext);
    expect((engine as any).rules).toEqual(rules);
    expect((engine as any).result).toEqual(initialResult);
  });

  it('should initialize with empty values when not provided', () => {
    const emptyEngine = new Engine(null as any);
    expect((emptyEngine as any).context).toEqual({});
    expect((emptyEngine as any).rules).toEqual([]);
    expect((emptyEngine as any).result).toEqual({});
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
        evaluate: () => true,
        action: () => ({})
      }
    ];
    engine.setRules(newRules);
    expect((engine as any).rules).toEqual(newRules);
  });

  it('should return the result with getResult', () => {
    const engine = new Engine(initialContext, rules, initialResult);
    expect(engine.getResult()).toEqual(initialResult);
  });

  it('should execute rules until no rule evaluates to true', () => {
    const engine = new Engine(initialContext, rules, initialResult);
    const result = engine.run().getResult();
    
    // After running, count should be 3 and flag should be true
    expect(result.count).toBe(3);
    expect(result.flag).toBe(true);
  });

  it('should maintain method chaining', () => {
    const newRules: Array<Rule<TestContext>> = [];

    const engine = new Engine(initialContext);
    
    const returnedEngine = engine
      .setRules(newRules)
      .setInitialResult(initialResult);
    
    expect(returnedEngine).toBe(engine);
  });

  it('should stop when no rules evaluate to true', () => {
    // Set initial context to a state where no rules will match
    const engine = new Engine({ startValue: 1, endValue: 0}, rules, initialResult);
    const result = engine.run().getResult();
    
    // Context should remain unchanged
    expect(result.count).toBe(1);
  });

  it('should throw an error when maximum iterations is exceeded', () => {
    const engine = new Engine(initialContext, rules, initialResult);
    expect(() => engine.run({ maxIterations: 1 })).toThrow('Rule engine exceeded maximum number of iterations');
  });
});