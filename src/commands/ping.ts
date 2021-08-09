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
import { Message, MessageEmbed } from "discord.js";

class command extends Command {
  constructor(context: PieceContext) {
    super(context, {
      name: "ping",
      description: "Pings me.",
    });
  }

  async run(msg: Message) {
    const m = await msg.channel.send({ content: "<a:loading:810925376586252308>" });
    const ping = m.createdTimestamp - msg.createdTimestamp;
    const embed = new MessageEmbed()
      .setColor(ping < 60 ? "#2a9d8f" : "#e9c46a")
      .setTitle("🏓 Pong!")
      .setDescription(`Message Ping: ${ping} \n WebSocket Ping: ${this.context.client.ws.ping}`)
      .setTimestamp();

    await m.edit({ embeds: [embed], content: null });
  }
}

export default command;
