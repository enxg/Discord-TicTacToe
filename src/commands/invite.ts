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

import { Command, PieceContext } from "@sapphire/framework";
import { ColorResolvable, Message, MessageEmbed, Permissions } from "discord.js";

import colors from "#config/colors.json";
import invites from "#config/invites.json";

const perms = new Permissions([
  Permissions.FLAGS.EMBED_LINKS,
]);

class command extends Command {
  constructor(context: PieceContext) {
    super(context, {
      name: "invite",
      preconditions: [{ name: "Permissions", context: { permissions: perms } }],
    });
  }

  async run(msg: Message) {
    const t = await this.container.fetchT(msg);

    const embed = new MessageEmbed()
      .setColor(colors.green as ColorResolvable)
      .addField(t("invite:invite.title"), `[${t("invite:invite.desc")}](${invites.bot})`)
      .addField(t("invite:support.title"), `[${t("invite:support.desc")}](${invites.ss})`)
      .setTimestamp();

    msg.channel.send({ embeds: [embed] });
  }
}

export default command;
