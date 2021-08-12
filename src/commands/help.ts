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

import { Args, Command, PieceContext } from "@sapphire/framework";
import { ColorResolvable, Message, MessageEmbed, Permissions } from "discord.js";
import { TFunction } from "@sapphire/plugin-i18next";

import colors from "#config/colors.json";
import usagesJson from "#config/usages.json";

export interface usagesD {
  [key: string]: string;
}

const usages = usagesJson as usagesD;

const perms = new Permissions([
  Permissions.FLAGS.EMBED_LINKS,
]);

class command extends Command {
  constructor(context: PieceContext) {
    super(context, {
      name: "help",
      preconditions: [{ name: "Permissions", context: { permissions: perms } }],
    });
  }

  async helpMenu(msg: Message, t: TFunction, commands: string[]) {
    const embed = new MessageEmbed()
      .setAuthor(t("help:embed.title"), this.container.client?.user?.avatarURL() ?? undefined)
      .setColor(colors.green as ColorResolvable)
      .setDescription(`${t("help:embed.usage", {
        helpCommand: "`t.help",
        commandName: `[${t("help:embed.v.command")}]\``,
      })}\n${t("help:embed.example", { example: "`t.help play`" })}`)
      .addField(t("help:embed.v.commands"), commands.map(i => `\`${i}\``).join(" "))
      .setTimestamp();

    return msg.channel.send({ embeds: [embed] });
  }

  async run(msg: Message, args: Args) {
    const t = await this.container.fetchT(msg);
    const commands = Array.from(this.container.stores.get("commands")?.keys());
    const aCommand = await args.pickResult("string");

    if (!aCommand.success || !commands.includes(aCommand.value)) {
      return this.helpMenu(msg, t, commands);
    }

    const { value } = aCommand;
    const embed = new MessageEmbed()
      .setColor(colors.green as ColorResolvable)
      .setAuthor(`t.${value}`, this.container.client.user?.avatarURL() ?? undefined)
      .setDescription(t(`help:commands.${value}`))
      .addField(t("help:embed.v.usage"), `t.${value} ${usages[value] ?? ""}`)
      .setTimestamp();

    return msg.channel.send({ embeds: [embed] });
  }
}

export default command;
