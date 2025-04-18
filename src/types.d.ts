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
type Context = object;

type Result = object;

type SwapBuffer = object;

interface RunOptions {
  maxIterations?: number;
}

type Rule<
  C extends Context = Context,
  R extends Result = Result,
  S extends SwapBuffer = SwapBuffer,
> = {
  name?: string;
  swapBuffer?: S;
  evaluate: (context: C, result: Partial<R>) => Promise<boolean>;
  action: (context: C, result: Partial<R>) => Promise<Partial<R>>;
};

type RuleEngineConstructor = new <C extends Context = Context, R extends Result = Result>(
  context: C,
  rules?: Array<Rule<C, R>>,
  initialResult?: R,
) => RuleEngine<C, R>;

type RuleEngine<C extends Context = Context, R extends Result = Result> = {
  getResult: () => Partial<R>;
  setInitialResult: (result: R) => RuleEngine<C, R>;
  setRules: (rules: Array<Rule<C, R>>) => RuleEngine<C, R>;
  run: (options?: RunOptions) => Promise<Partial<R>>;
};

export type { Context, Result, RunOptions, Rule, RuleEngine, RuleEngineConstructor, SwapBuffer };
