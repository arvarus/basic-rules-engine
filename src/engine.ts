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
import deepFreeze from 'deep-freeze-strict';
import {
  Context,
  Result,
  RunOptions,
  Rule,
  RuleEngine,
  RuleEngineConstructor,
  ExecutionStatistics,
} from './types';

/**
 * Rule engine implementation
 */
const Engine: RuleEngineConstructor = class<C extends Context = Context, R extends Result = Result>
  implements RuleEngine<C, R>
{
  private readonly context: Readonly<C>;
  private rules: Array<Rule<C, R>>;
  private result: Partial<R>;
  private nbIterations: number = 0;
  private statistics?: ExecutionStatistics;

  /**
   * Creates a new rule engine instance
   * @param context - The immutable context for rule evaluation
   * @param rules - Array of rules to execute
   * @param initialResult - Initial result object
   */
  constructor(context: C, rules: Array<Rule<C, R>> = [], initialResult: Partial<R> = {}) {
    this.context = deepFreeze(context || {});
    this.rules = rules;
    this.result = initialResult;
  }

  /**
   * Sets the initial result
   * @param result - The initial result object
   * @returns This engine instance for chaining
   */
  setInitialResult(result: R): RuleEngine<C, R> {
    this.result = result;
    return this;
  }

  /**
   * Gets the current result
   * @returns The current result object
   */
  getResult(): Partial<R> {
    return this.result;
  }

  /**
   * Sets the rules for the engine
   * @param rules - Array of rules to execute
   * @returns This engine instance for chaining
   */
  setRules(rules: Array<Rule<C, R>>): RuleEngine<C, R> {
    this.rules = rules;
    return this;
  }

  /**
   * Gets execution statistics
   * @returns Execution statistics if collectStats was enabled, undefined otherwise
   */
  getStatistics(): ExecutionStatistics | undefined {
    return this.statistics;
  }

  /**
   * Gets the name of a rule for logging/error purposes
   */
  private getRuleName(rule: Rule<C, R>, index: number): string {
    return rule.name || `Rule #${index + 1}`;
  }

  /**
   * Initializes statistics collection
   */
  private initializeStatistics(): void {
    this.statistics = {
      totalIterations: 0,
      totalTimeMs: 0,
      ruleStats: new Map(),
    };

    // Initialize stats for each rule
    this.rules.forEach((rule, index) => {
      const ruleName = this.getRuleName(rule, index);
      this.statistics!.ruleStats.set(ruleName, {
        ruleName,
        evaluationCount: 0,
        executionCount: 0,
        evaluationTimeMs: 0,
        executionTimeMs: 0,
      });
    });
  }

  /**
   * Updates statistics for a rule evaluation
   */
  private updateEvaluationStats(ruleName: string, timeMs: number): void {
    if (!this.statistics) return;

    const stats = this.statistics.ruleStats.get(ruleName);
    if (stats) {
      stats.evaluationCount++;
      stats.evaluationTimeMs += timeMs;
    }
  }

  /**
   * Updates statistics for a rule execution
   */
  private updateExecutionStats(ruleName: string, timeMs: number): void {
    if (!this.statistics) return;

    const stats = this.statistics.ruleStats.get(ruleName);
    if (stats) {
      stats.executionCount++;
      stats.executionTimeMs += timeMs;
    }
  }

  /**
   * Finds the next rule to evaluate
   */
  private async getNextRuleToEvaluate(options: RunOptions<C, R>): Promise<Rule<C, R> | undefined> {
    for (let i = 0; i < this.rules.length; i++) {
      const rule = this.rules[i];
      const ruleName = this.getRuleName(rule, i);

      try {
        const startTime = performance.now();
        const shouldEvaluate = await rule.evaluate(this.context, this.result);
        const endTime = performance.now();

        if (options.collectStats) {
          this.updateEvaluationStats(ruleName, endTime - startTime);
        }

        if (options.debug) {
          console.log(`[RuleEngine] Evaluated "${ruleName}": ${shouldEvaluate}`);
        }

        if (shouldEvaluate) {
          return rule;
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        const enhancedError = new Error(`Error evaluating rule "${ruleName}": ${err.message}`);
        enhancedError.stack = err.stack;

        if (options.onError) {
          await options.onError(enhancedError, rule, this.context, this.result, 'evaluate');
        }

        if (options.continueOnError) {
          if (options.debug) {
            console.error(`[RuleEngine] Error in "${ruleName}" evaluation (continuing):`, err);
          }
          continue;
        } else {
          throw enhancedError;
        }
      }
    }
    return undefined;
  }

  /**
   * Runs the rule engine
   * @param options - Execution options
   * @returns The final result
   */
  async run(options: RunOptions<C, R> = {}): Promise<Partial<R>> {
    const maxIterations = options.maxIterations ?? 1000;
    const startTime = performance.now();

    if (options.collectStats) {
      this.initializeStatistics();
    }

    if (options.debug) {
      console.log('[RuleEngine] Starting execution with', this.rules.length, 'rules');
    }

    this.nbIterations = 0;
    let ruleToRun = await this.getNextRuleToEvaluate(options);

    while (ruleToRun) {
      this.nbIterations++;

      if (this.nbIterations > maxIterations) {
        throw new Error(
          `Rule engine exceeded maximum number of iterations (${maxIterations}). This may indicate an infinite loop.`,
        );
      }

      const ruleIndex = this.rules.indexOf(ruleToRun);
      const ruleName = this.getRuleName(ruleToRun, ruleIndex);

      try {
        // Call beforeRule hook
        if (options.beforeRule) {
          await options.beforeRule(ruleToRun, this.context, this.result);
        }

        if (options.debug) {
          console.log(`[RuleEngine] Executing "${ruleName}" (iteration ${this.nbIterations})`);
        }

        const actionStartTime = performance.now();
        const resultUpdates = await ruleToRun.action(this.context, this.result);
        const actionEndTime = performance.now();

        if (options.collectStats) {
          this.updateExecutionStats(ruleName, actionEndTime - actionStartTime);
        }

        if (resultUpdates) {
          this.result = { ...this.result, ...resultUpdates };
        }

        // Call afterRule hook
        if (options.afterRule) {
          await options.afterRule(ruleToRun, this.context, this.result, resultUpdates);
        }

        if (options.debug && resultUpdates) {
          console.log(`[RuleEngine] "${ruleName}" updated result:`, resultUpdates);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        const enhancedError = new Error(`Error executing rule "${ruleName}": ${err.message}`);
        enhancedError.stack = err.stack;

        if (options.onError) {
          await options.onError(enhancedError, ruleToRun, this.context, this.result, 'action');
        }

        if (options.continueOnError) {
          if (options.debug) {
            console.error(`[RuleEngine] Error in "${ruleName}" execution (continuing):`, err);
          }
        } else {
          throw enhancedError;
        }
      }

      ruleToRun = await this.getNextRuleToEvaluate(options);
    }

    const endTime = performance.now();

    if (options.collectStats && this.statistics) {
      this.statistics.totalIterations = this.nbIterations;
      this.statistics.totalTimeMs = endTime - startTime;
    }

    if (options.debug) {
      console.log(
        `[RuleEngine] Completed execution after ${this.nbIterations} iterations in ${(endTime - startTime).toFixed(2)}ms`,
      );
    }

    return this.getResult();
  }
};

export default Engine;
