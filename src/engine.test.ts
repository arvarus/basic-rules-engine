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
  count: number;
  flag: boolean;
}

interface TestResult extends Result {
  finalCount: number;
}

describe('Engine', () => {
  // Setup test variables
  let engine: Engine<TestContext, TestResult>;
  let initialContext: TestContext;
  let rules: Array<Rule<TestContext>>;
  let initialResult: TestResult;

  beforeEach(() => {
    // Setup initial test data
    initialContext = { count: 0, flag: false };
    initialResult = { finalCount: 0 };

    // Define rules for testing
    rules = [
      {
        name: 'Increment count when less than 3',
        evaluate: (context) => context.count < 3,
        action: (context) => ({ count: context.count + 1 })
      },
      {
        name: 'Set flag when count equals 3',
        evaluate: (context) => context.count === 3 && !context.flag,
        action: (context) => ({ flag: true })
      }
    ];

    // Initialize engine
    engine = new Engine<TestContext, TestResult>(initialContext, rules, initialResult);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with provided context, rules, and result', () => {
    expect(engine.context).toEqual(initialContext);
    expect(engine.rules).toEqual(rules);
    expect(engine.result).toEqual(initialResult);
  });

  it('should initialize with empty values when not provided', () => {
    const emptyEngine = new Engine(null as any, null as any, null as any);
    expect(emptyEngine.context).toEqual({});
    expect(emptyEngine.rules).toEqual([]);
    expect(emptyEngine.result).toEqual({});
  });

  it('should update context with setContext', () => {
    const newContext = { count: 5, flag: true };
    engine.setContext(newContext);
    expect(engine.context).toEqual(newContext);
  });

  it('should set initial result with setInitialResult', () => {
    const newResult = { finalCount: 10 };
    engine.setInitialResult(newResult);
    expect(engine.getResult()).toEqual(newResult);
  });

  it('should update rules with setRules', () => {
    const newRules: Array<Rule<TestContext>> = [
      {
        evaluate: () => true,
        action: () => ({})
      }
    ];
    engine.setRules(newRules);
    expect(engine.rules).toEqual(newRules);
  });

  it('should return the result with getResult', () => {
    expect(engine.getResult()).toEqual(initialResult);
  });

  it('should execute rules until no rule evaluates to true', () => {
    engine.run();
    
    // After running, count should be 3 and flag should be true
    expect(engine.context.count).toBe(3);
    expect(engine.context.flag).toBe(true);
  });

  it('should maintain method chaining', () => {
    const newContext = { count: 1, flag: false };
    const newRules: Array<Rule<TestContext>> = [];
    
    const returnedEngine = engine
      .setContext(newContext)
      .setRules(newRules)
      .setInitialResult(initialResult);
    
    expect(returnedEngine).toBe(engine);
  });

  it('should stop when no rules evaluate to true', () => {
    // Set initial context to a state where no rules will match
    engine.setContext({ count: 10, flag: true });
    engine.run();
    
    // Context should remain unchanged
    expect(engine.context.count).toBe(10);
  });
});