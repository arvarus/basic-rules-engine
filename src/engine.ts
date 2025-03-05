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
import { RuleEngine, Rule, Context, Result } from './types';

class Engine<C extends Context = Context, R extends Result = Result> implements RuleEngine<C, Partial<R>> {
  private readonly context: Readonly<C>;
  private rules: Array<Rule<C, R>>;
  private result: Partial<R>;

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
  
  run() {
    let ruleToRun = this.rules.find(rule => rule.evaluate(this.context, this.result));

    while (ruleToRun) {
      const resultUpdates = ruleToRun.action(this.context, this.result);

      if (resultUpdates) {
        this.result = { ...this.result, ...resultUpdates };
      }

      ruleToRun = this.rules.find(rule => rule.evaluate(this.context, this.result));
    }

    return this;
  };
};

export default Engine;