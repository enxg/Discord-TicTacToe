/*
 *     Discord Tic-Tac-Toe
 *     Copyright (C) 2021  Enes Genç
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU Affero General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Argument, PieceContext } from "@sapphire/framework";

class argument extends Argument<string> {
  constructor(context: PieceContext) {
    super(context, {
      name: "language",
    });
  }

  async run(parameter: string) {
    if (!this.container.i18n.languages.has(parameter)) {
      return this.error({
        parameter,
        identifier: "languageNotSupported",
        message: "This language isn't supported.",
      });
    }

    return this.ok(parameter);
  }
}

export default argument;
