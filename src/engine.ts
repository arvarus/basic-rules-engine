/*
 * Copyright (C) 2025-26 - PPRB
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
import deepFreeze from './deep-freeze.js';
import type {
  Context,
  Result,
  RunOptions,
  Rule,
  RuleEngine,
  RuleEngineConstructor,
} from './types.js';

const DEFAULT_MAX_ITERATIONS = 1000;

const Engine: RuleEngineConstructor = class<
  C extends Context = Context,
  R extends Result = Result,
> implements RuleEngine<C, R> {
  private readonly context: Readonly<C>;
  private rules: Array<Rule<C, R>>;
  private result: Partial<R>;

  constructor(context: C, rules: Array<Rule<C, R>> = [], initialResult: Partial<R> = {}) {
    this.context = deepFreeze(context || {});
    this.rules = rules;
    this.result = initialResult;
  }

  setInitialResult(result: Partial<R>): RuleEngine<C, R> {
    this.result = result;
    return this;
  }

  getResult(): Partial<R> {
    return this.result;
  }

  setRules(rules: Array<Rule<C, R>>): RuleEngine<C, R> {
    this.rules = rules;
    return this;
  }

  private async findNextRule(): Promise<Rule<C, R> | undefined> {
    for (const rule of this.rules) {
      if (await rule.evaluate(this.context, this.result)) {
        return rule;
      }
    }
    return undefined;
  }

  async run(options: RunOptions = {}): Promise<Partial<R>> {
    const maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;

    for (let iteration = 0; ; iteration++) {
      const rule = await this.findNextRule();
      if (!rule) {
        return this.result;
      }
      if (iteration >= maxIterations) {
        throw new Error('Rule engine exceeded maximum number of iterations');
      }
      this.result = { ...this.result, ...(await rule.action(this.context, this.result)) };
    }
  }
};

export default Engine;
