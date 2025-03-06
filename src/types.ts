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
interface Context {};

interface Result {};

interface RunOptions {
  maxIterations?: number;
}

type Rule<C extends Context = Context, R extends Result = Result> = {
  name?: string;
  evaluate: (context: C, result: Partial<R>) => boolean;
  action: (context: C, result: Partial<R>) => Partial<R>;
}

type RuleEngineConstructor = new <C extends Context = Context, R extends Result = Result>(context: C, rules?: Array<Rule<C, R>>, initialResult?: Partial<R>) => RuleEngine<C, Partial<R>>;

type RuleEngine<C extends Context = Context, R extends Result = Result> = {
  getResult: () => Partial<R>;
  setInitialResult: (result: Partial<R>) => RuleEngine<C, Partial<R>>;
  setRules: (rules: Array<Rule<C, Partial<R>>>) => RuleEngine<C, Partial<R>>;
  run: (options?: RunOptions) => RuleEngine<C, Partial<R>>;
};

export type { 
  Context, 
  Result, 
  RunOptions,
  Rule ,
  RuleEngine, 
  RuleEngineConstructor, 
};
