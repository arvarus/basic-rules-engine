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

type Rule<C extends Context = Context> = {
  name?: string;
  evaluate: (context: C) => boolean;
  action: (context: C) => Partial<C>;
}

type RuleEngine<C extends Context = Context, R extends Result = Result> = {
  getResult: () => R;
  setContext: (context: C) => RuleEngine<C>;
  setRules: (rules: Array<Rule<C>>) => RuleEngine<C>;
  run: () => void;
};

export type { Context, RuleEngine, Result, Rule };
