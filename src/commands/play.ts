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

import { chunk } from "@sapphire/utilities";
import { Args, Command, PieceContext } from "@sapphire/framework";
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageButtonStyleResolvable,
  User,
} from "discord.js";

import emojis from "../config/emojis.json";

type square = "X" | "O" | null;

class command extends Command {
  private leaderboard: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;

  constructor(context: PieceContext) {
    super(context, {
      name: "play",
      description: "Play Tic-Tac-Toe with your friend or with the AI.",
    });

    this.leaderboard = this.context.db.collection("leaderboard");
  }

  // eslint-disable-next-line class-methods-use-this
  private async calculateWin(squares: square[]) {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    let win = false;

    await lines.forEach(arr => {
      const [a, b, c] = arr;

      if (squares[a] !== null && squares[a] === squares[b] && squares[a] === squares[c]) {
        win = true;
      }
    });

    return win;
  }

  // eslint-disable-next-line class-methods-use-this
  private async buildButtons(board: square[], disableAll: boolean = false) {
    // const components: MessageActionRow[] = Array(3).fill(new MessageActionRow());
    const squareOptions = (s: square): { style: MessageButtonStyleResolvable, emoji: string } => {
      switch (s) {
        case "X":
          return {
            style: "SUCCESS",
            emoji: emojis.times,
          };
        case "O":
          return {
            style: "DANGER",
            emoji: emojis.circle,
          };
        default:
          return {
            style: "SECONDARY",
            emoji: emojis.blank,
          };
      }
    };

    const boardChunk = chunk(board, 3);

    return boardChunk.map((e, i) => new MessageActionRow()
      .addComponents(e.map((ee, ii) => new MessageButton()
        .setStyle(squareOptions(ee).style)
        .setEmoji(squareOptions(ee).emoji)
        .setCustomId(`${i * 3 + ii}`)
        .setDisabled(disableAll))));
  }

  async uGame(msg: Message, user: User) {
    const board: square[] = Array(9).fill(null);
    const turn = {
      p: Math.random() <= 0.5 ? msg.author : user,
      isX: true,
    };
    const turnText = () => `${turn.p}'s Turn. You have 30 seconds to make a move.`;

    const m = await msg.channel.send({ content: emojis.loading });
    const filter = (i: ButtonInteraction) => {
      i.deferUpdate();
      return i.user === turn.p && board[parseInt(i.customId, 10)] === null;
    };

    const wp = async () => {
      // FIXME: If message is deleted, bot will crash.

      m.edit({ content: turnText(), components: await this.buildButtons(board) });
      m.awaitMessageComponent({ filter, componentType: "BUTTON", time: 30000 })
        .then(async (i: ButtonInteraction) => {
          board[parseInt(i.customId, 10)] = turn.isX ? "X" : "O";
          turn.isX = !turn.isX;

          const win = await this.calculateWin(board);
          if (win) return m.edit({ content: `${turn.p} won!`, components: await this.buildButtons(board, true) });
          if (!win && !board.includes(null)) return m.edit({ content: "Tie!", components: await this.buildButtons(board, true) });

          turn.p = turn.p === msg.author ? user : msg.author;

          wp();
        })
        .catch(() => m.reply({ content: `${turn.p} didn't make a move in 30 seconds.` }));
    };

    wp();
  }

  // eslint-disable-next-line class-methods-use-this
  async AIgame(msg: Message) {
    await msg.channel.send("Playing with the AI is coming soon.");

    // TODO: Playing with the AI, 3 difficulties.
  }

  async run(msg: Message, args: Args) {
    const user = await args.pickResult("user");

    if (!user.success) return this.AIgame(msg);
    if (user.value.bot && user.value !== this.context.client.user) return msg.channel.send("You can't play with the other bots.");
    if (user.value === this.context.client.user) return this.AIgame(msg);
    if (msg.author === user.value) return msg.channel.send("You can't play with yourself, dummy.");

    const row = new MessageActionRow()
      .addComponents([
        {
          label: "Accept",
          type: "BUTTON",
          style: "SUCCESS",
          customId: "accept",
        },
        {
          label: "Decline",
          type: "BUTTON",
          style: "DANGER",
          customId: "decline",
        },
      ]);

    const m = await msg.channel.send({ content: `Invited ${user.value}. They have one minute to accept.`, components: [row] });

    row.components.forEach(c => c.setDisabled(true));

    const collector = m.createMessageComponentCollector({ componentType: "BUTTON", time: 60000 });

    collector.on("collect", async (i): Promise<any> => {
      await i.deferUpdate();
      if (i.user !== user.value) return;
      if (i.customId === "decline") {
        await m.reply({ content: `${user.value.tag} declined the game invite.` });
        await m.edit({ components: [row] });
      }
      if (i.customId !== "accept") return;
      await m.edit({ components: [row] });
      return this.uGame(msg, user.value);
    });

    collector.on("end", async () => {
      await m.edit({ components: [row] });
    });
  }
}

export default command;
