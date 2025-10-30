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

/**
 * Base type for rule engine context
 */
type Context = object;

/**
 * Base type for rule engine result
 */
type Result = object;

/**
 * Base type for swap buffer used to store intermediate values within a rule
 */
type SwapBuffer = object;

/**
 * Statistics about a single rule execution
 */
interface RuleExecutionStats {
  /** Name of the rule */
  ruleName: string;
  /** Number of times the rule was evaluated */
  evaluationCount: number;
  /** Number of times the rule was executed (action was called) */
  executionCount: number;
  /** Total time spent in evaluation (milliseconds) */
  evaluationTimeMs: number;
  /** Total time spent in action execution (milliseconds) */
  executionTimeMs: number;
}

/**
 * Overall execution statistics for the rule engine
 */
interface ExecutionStatistics {
  /** Total number of iterations */
  totalIterations: number;
  /** Total execution time in milliseconds */
  totalTimeMs: number;
  /** Statistics for each rule */
  ruleStats: Map<string, RuleExecutionStats>;
}

/**
 * Hook called before a rule is executed
 */
type BeforeRuleHook<C extends Context = Context, R extends Result = Result> = (
  rule: Rule<C, R>,
  context: C,
  result: Partial<R>,
) => void | Promise<void>;

/**
 * Hook called after a rule is executed
 */
type AfterRuleHook<C extends Context = Context, R extends Result = Result> = (
  rule: Rule<C, R>,
  context: C,
  result: Partial<R>,
  updates: Partial<R> | undefined,
) => void | Promise<void>;

/**
 * Hook called when an error occurs during rule evaluation or execution
 */
type ErrorHook<C extends Context = Context, R extends Result = Result> = (
  error: Error,
  rule: Rule<C, R>,
  context: C,
  result: Partial<R>,
  phase: 'evaluate' | 'action',
) => void | Promise<void>;

/**
 * Options for running the rule engine
 */
interface RunOptions<C extends Context = Context, R extends Result = Result> {
  /** Maximum number of iterations before throwing an error (default: 1000) */
  maxIterations?: number;
  /** Enable debug logging to console */
  debug?: boolean;
  /** Collect execution statistics */
  collectStats?: boolean;
  /** Hook called before each rule execution */
  beforeRule?: BeforeRuleHook<C, R>;
  /** Hook called after each rule execution */
  afterRule?: AfterRuleHook<C, R>;
  /** Hook called when an error occurs */
  onError?: ErrorHook<C, R>;
  /** If true, continue execution even if a rule throws an error */
  continueOnError?: boolean;
}

/**
 * A rule in the rule engine
 */
type Rule<
  C extends Context = Context,
  R extends Result = Result,
  S extends SwapBuffer = SwapBuffer,
> = {
  /** Optional name for the rule (used in error messages and debugging) */
  name?: string;
  /** Optional swap buffer for storing intermediate values */
  swapBuffer?: S;
  /** Function to determine if the rule should be executed */
  evaluate: (context: C, result: Partial<R>) => Promise<boolean>;
  /** Function to execute the rule and return result updates */
  action: (context: C, result: Partial<R>) => Promise<Partial<R>>;
};

/**
 * Constructor for the rule engine
 */
type RuleEngineConstructor = new <C extends Context = Context, R extends Result = Result>(
  context: C,
  rules?: Array<Rule<C, R>>,
  initialResult?: R,
) => RuleEngine<C, R>;

/**
 * Main rule engine interface
 */
type RuleEngine<C extends Context = Context, R extends Result = Result> = {
  /** Get the current result */
  getResult: () => Partial<R>;
  /** Set the initial result */
  setInitialResult: (result: R) => RuleEngine<C, R>;
  /** Set the rules for the engine */
  setRules: (rules: Array<Rule<C, R>>) => RuleEngine<C, R>;
  /** Run the rule engine with optional configuration */
  run: (options?: RunOptions<C, R>) => Promise<Partial<R>>;
  /** Get execution statistics (only available if collectStats was enabled) */
  getStatistics: () => ExecutionStatistics | undefined;
};

export type {
  Context,
  Result,
  RunOptions,
  Rule,
  RuleEngine,
  RuleEngineConstructor,
  SwapBuffer,
  ExecutionStatistics,
  RuleExecutionStats,
  BeforeRuleHook,
  AfterRuleHook,
  ErrorHook,
};
