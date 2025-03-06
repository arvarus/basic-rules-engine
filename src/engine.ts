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
  Rule ,
  RuleEngine, 
  RuleEngineConstructor, 
 } from './types';

const Engine: RuleEngineConstructor = class <C extends Context = Context, R extends Result = Result> implements RuleEngine<C, R> {
  private readonly context: Readonly<C>;
  private rules: Array<Rule<C, R>>;
  private result: Partial<R>;
  private nbIterations: number = 0;
  private swapBuffer: Record<string, any> = {};

  constructor(context: C, rules: Array<Rule<C, R>> = [], initialResult: Partial<R> = {}) {
    this.context = deepFreeze(context || {});
    this.rules = rules;
    this.result = initialResult;
  };

  setInitialResult(result: Partial<R>) {
    this.result = result;
    return this;
  };

  getResult() {
    return this.result;
  };

  setRules(rules: Array<Rule<C, R>>) {
    this.rules = rules;
    return this;
  };

  private getNextRuleToEvaluate() {
    return this.rules.find(rule => rule.evaluate(this.context, this.result, this.swapBuffer));
  };
  
  run(options: RunOptions = {}) {
    const maxIterations = options.maxIterations ?? 1000;
    this.nbIterations = 0;
    let ruleToRun = this.getNextRuleToEvaluate();

    while (ruleToRun) {
      this.nbIterations++;
      
      if (this.nbIterations > maxIterations) {
        throw new Error('Rule engine exceeded maximum number of iterations');
      }
      
      const resultUpdates = ruleToRun.action(this.context, this.result, this.swapBuffer);
      
      if (resultUpdates) {
        this.result = { ...this.result, ...resultUpdates };
      }
      
      this.swapBuffer = {};
      ruleToRun = this.getNextRuleToEvaluate();
    }

    return this;
  };
};

export default Engine;