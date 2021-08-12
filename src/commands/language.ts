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

/* eslint-disable camelcase */

import { Args, PieceContext } from "@sapphire/framework";
import { SubCommandPluginCommand } from "@sapphire/plugin-subcommands";
import { ColorResolvable, Message, MessageEmbed, Permissions } from "discord.js";
import emojiJson from "#config/emojis.json";
import colors from "#config/colors.json";

interface emojiD {
  blank: string;
  times: string;
  circle: string;
  loading: string;
  flags: { [key: string]: string };
}

const emojis = emojiJson as emojiD;
const perms = new Permissions([
  Permissions.FLAGS.EMBED_LINKS,
]);

class command extends SubCommandPluginCommand {
  private collection: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;

  constructor(context: PieceContext) {
    super(context, {
      name: "language",
      detailedDescription: "",
      subCommands: [{ input: "help", default: true }, "set", "show"],
      preconditions: [{ name: "Permissions", context: { permissions: perms } }],
    });

    this.collection = this.container.db.collection("languages");
  }

  async show(msg: Message) {
    const t = await this.container.fetchT(msg);
    msg.channel.send(t("language:show", {
      language: await this.container.i18n.fetchLanguage({
        channel: null,
        author: null,
        guild: msg.guild,
      }),
    }));
  }

  async help(msg: Message) {
    const t = await this.container.fetchT(msg);

    const availableLanguages = Array.from(this.container.i18n.languages.keys())
      .map((i: string) => `${emojis.flags[i]} | ${i}`)
      .join("\n");

    const embed = new MessageEmbed()
      .addField(t("language:help.available"), availableLanguages)
      .addField(t("language:help.crowdin"), `[${t("language:help.visitcrowdin")}](https://translate.ttt.infinixlabs.xyz)`)
      .setColor(colors.green as ColorResolvable)
      .setFooter(t("language:help.disclaimer"));

    msg.channel.send({ embeds: [embed] });
  }

  async set(msg: Message, args: Args) {
    let t = await this.container.fetchT(msg);
    if (!msg.member?.permissions.has("MANAGE_GUILD")) return msg.channel.send(t("msp"));

    const newLang = await args.pickResult("language");

    if (!newLang.success || !this.container.i18n.languages.has(newLang.value)) {
      msg.channel.send(t("language:set.languageNotSupported"));
      return this.help(msg);
    }

    return this.collection.doc(msg.guild?.id as string).set({
      language: newLang.value,
    })
      .then(async () => {
        t = await this.container.fetchT(msg);
        msg.channel.send(`${t("language:set.success", { language: newLang.value })}`);
      })
      .catch(() => msg.channel.send(t("language:set.error")));
  }
}

export default command;
