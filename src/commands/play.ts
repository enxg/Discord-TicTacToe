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

import emojis from "#config/emojis.json";

type square = "X" | "O" | null;
interface blocklist {
  blockedUsers: string[],
  blockedGuilds: string[],
}

class command extends Command {
  private leaderboard: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;
  private blocks: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;

  constructor(context: PieceContext) {
    super(context, {
      name: "play",
    });

    this.leaderboard = this.container.db.collection("leaderboard");
    this.blocks = this.container.db.collection("blocks");
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
    const t = await this.container.fetchT(msg);

    const board: square[] = Array(9).fill(null);
    const turn = {
      p: Math.random() <= 0.5 ? msg.author : user,
      isX: true,
    };
    const turnText = () => t("play:uGame.turn", { user: `${turn.p}` });

    const m = await msg.channel.send({ content: emojis.loading });
    const filter = (i: ButtonInteraction) => {
      i.deferUpdate();
      return i.user === turn.p && board[parseInt(i.customId, 10)] === null;
    };

    const wp = async () => {
      // FIXED: If message is deleted, bot will crash.

      m.edit({ content: turnText(), components: await this.buildButtons(board) });
      m.awaitMessageComponent({ filter, componentType: "BUTTON", time: 30000 })
        .then(async (i: ButtonInteraction) => {
          board[parseInt(i.customId, 10)] = turn.isX ? "X" : "O";
          turn.isX = !turn.isX;

          const win = await this.calculateWin(board);
          if (win) return m.edit({ content: t("play:uGame.win", { user: `${turn.p}` }), components: await this.buildButtons(board, true) });
          if (!board.includes(null)) return m.edit({ content: t("play:uGame.tie"), components: await this.buildButtons(board, true) });

          turn.p = turn.p === msg.author ? user : msg.author;

          wp();
        })
        .catch(e => {
          this.container.sentry.captureException(e);
          msg.channel.send({ content: t("play:uGame.dmm", { user: `${turn.p}` }) });
        });
    };

    wp();
  }

  // eslint-disable-next-line class-methods-use-this
  async AIgame(msg: Message) {
    await msg.channel.send("Playing with the AI is coming soon.");

    // TODO: Playing with the AI, 3 difficulties.
  }

  async run(msg: Message, args: Args) {
    try {
      const t = await this.container.fetchT(msg);
      const { captureException } = this.container.sentry;

      const user = await args.pickResult("user");

      if (!user.success) return this.AIgame(msg);
      if (user.value.bot && user.value !== this.container.client.user) return msg.channel.send(t("play:error.bot"));
      if (user.value === this.container.client.user) return this.AIgame(msg);
      if (msg.author === user.value) return msg.channel.send(t("play:error.self"));

      const blocklistA = (await this.blocks.doc(user.value.id).get()).data() as blocklist;
      const blocklistB = (await this.blocks.doc(msg.author.id).get()).data() as blocklist;

      if (blocklistA?.blockedUsers?.length > 0 && blocklistA.blockedUsers?.includes(msg.author.id)) return msg.channel.send(t("play:blocked.u1"));
      if (blocklistA?.blockedGuilds?.length > 0 && blocklistA.blockedGuilds?.includes(msg.guild?.id as string)) return msg.channel.send(t("play:blocked.g1"));
      if (blocklistB?.blockedUsers?.length > 0 && blocklistB.blockedUsers?.includes(user.value.id)) return msg.channel.send(t("play:blocked.u2"));
      if (blocklistB?.blockedGuilds?.length > 0 && blocklistB.blockedGuilds?.includes(msg.guild?.id as string)) return msg.channel.send(t("play:blocked.g2"));

      const row = new MessageActionRow()
        .addComponents([
          {
            label: t("play:invite.accept"),
            type: "BUTTON",
            style: "SUCCESS",
            customId: "accept",
          },
          {
            label: t("play:invite.decline"),
            type: "BUTTON",
            style: "DANGER",
            customId: "decline",
          },
        ]);

      const m = await msg.channel.send({
        content: t("play:invite.invited", { user: `${user.value}` }),
        components: [row],
      });

      row.components.forEach(c => c.setDisabled(true));

      const collector = m.createMessageComponentCollector({ componentType: "BUTTON", time: 60000 });

      collector.on("collect", async (i): Promise<any> => {
        await i.deferUpdate();
        if (i.user !== user.value) return;
        if (i.customId === "decline") {
          await m.reply({ content: t("play:invite.declined", { user: user.value.tag }) });
          await m.edit({ components: [row] });
        }
        if (i.customId !== "accept") return;
        await m.edit({ components: [row] });
        return this.uGame(msg, user.value);
      });

      collector.on("end", async (): Promise<any> => m.edit({ components: [row] }).catch(e => captureException(e)));
    } catch(e) {
      this.container.sentry.captureException(e);
    }
  }
}

export default command;
