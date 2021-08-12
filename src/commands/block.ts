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
 *     You should haveg received a copy of the GNU Affero General Public License
 *     along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { PieceContext, Args } from "@sapphire/framework";
import { SubCommandPluginCommand } from "@sapphire/plugin-subcommands";
import { ColorResolvable, Message, MessageEmbed, Permissions } from "discord.js";
import { TFunction } from "@sapphire/plugin-i18next";
import colors from "#config/colors.json";

type id = string | `${bigint}`;

const perms = new Permissions([
  Permissions.FLAGS.EMBED_LINKS,
]);

class command extends SubCommandPluginCommand {
  private collection: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;

  constructor(context: PieceContext) {
    super(context, {
      name: "block",
      subCommands: ["add", "remove", { input: "list", default: true }],
      flags: ["guild"],
      preconditions: [{ name: "Permissions", context: { permissions: perms } }],
    });

    this.collection = this.container.db.collection("blocks");
  }

  async listUser(list: FirebaseFirestore.DocumentData | undefined, t: TFunction) {
    if (!list || list["blockedUsers"] == null || list["blockedUsers"].length === 0) return [t("block:errors.didnt_block_user")];

    // eslint-disable-next-line prefer-destructuring
    const blockedUsers: id[] = list["blockedUsers"];
    return Promise.all(blockedUsers.map(async (u: id) => {
      const user = await this.container.client.users.fetch(u as `${bigint}`);
      return `${user?.tag ?? t("block:errors.cant_fetch.user")} - ${u}`;
    }));
  }

  async listGuild(list: FirebaseFirestore.DocumentData | undefined, t: TFunction) {
    if (!list || list["blockedGuilds"] == null || list["blockedGuilds"].length === 0) return [t("block:errors.didnt_block_guild")];

    // eslint-disable-next-line prefer-destructuring
    const blockedGuilds: id[] = list["blockedGuilds"];
    return Promise.all(blockedGuilds.map(async (u: id) => {
      const guild = await this.container.client.guilds.fetch(u as `${bigint}`);
      return `${guild?.name ?? t("block:errors.cant_fetch.block")} - ${u}`;
    }));
  }

  async list(msg: Message) {
    const t = await this.container.fetchT(msg);
    const doc = await this.collection.doc(msg.author.id).get();

    if (!doc.exists) return msg.channel.send({ content: t("block:errors.didnt_block") });

    const blocklist = doc.data();
    const blockedUsers = await this.listUser(blocklist, t);
    const blockedGuilds = await this.listGuild(blocklist, t);

    const embed = new MessageEmbed()
      .setTitle(t("block:your_blocklist"))
      .addField(t("block:blocked.users"), blockedUsers.join("\n"))
      .addField(t("block:blocked.guilds"), blockedGuilds.join("\n"))
      .setColor(colors.red as ColorResolvable)
      .setTimestamp();

    return msg.channel.send({ embeds: [embed] });
  }

  async add(msg: Message, args: Args) {
    const t = await this.container.fetchT(msg);
    const { captureException } = this.container.sentry;

    if (args.getFlags("guild")) {
      return this.collection.doc(msg.author.id).set({
        blockedGuilds: this.container.fb.firestore.FieldValue.arrayUnion(msg.guild?.id),
      }, { merge: true })
        .then(() => msg.channel.send({ content: t("block:add.guild", { guildName: `\`${msg.guild?.name}\`` }) }))
        .catch(e => {
          captureException(e);
          msg.channel.send({ content: t("block:errors.add.guild") });
        });
    }

    const user = await args.pickResult("user");

    if (!user.success) return msg.channel.send({ content: t("block:errors.add.user.none") });
    if (user.value.id === msg.author.id) return msg.channel.send({ content: t("block:errors.add.user.self") });
    if (user.value.bot) return msg.channel.send({ content: t("block:errors.add.user.bot") });

    return this.collection.doc(msg.author.id).set({
      blockedUsers: this.container.fb.firestore.FieldValue.arrayUnion(user.value.id),
    }, { merge: true })
      .then(() => msg.channel.send({ content: t("block:add.user", { userName: `\`${user.value.tag}\`` }) }))
      .catch(e => {
        captureException(e);
        msg.channel.send({ content: t("block:errors.add.user.cantadd") });
      });
  }

  async remove(msg: Message, args: Args) {
    const t = await this.container.fetchT(msg);
    const { captureException } = this.container.sentry;

    if (args.getFlags("guild")) {
      return this.collection.doc(msg.author.id).set({
        blockedGuilds: this.container.fb.firestore.FieldValue.arrayRemove(msg.guild?.id),
      }, { merge: true })
        .then(() => msg.channel.send({ content: t("block:remove.guild", { guildName: `\`${msg.guild?.name}\`` }) }))
        .catch(e => {
          captureException(e);
          msg.channel.send({ content: t("block:errors.remove.guild") });
        });
    }

    const user = await args.pickResult("user");

    if (!user.success) return msg.channel.send({ content: t("block:errors.remove.user.none") });
    if (user.value.id === msg.author.id) return msg.channel.send({ content: t("block:errors.remove.user.self") });
    if (user.value.bot) return msg.channel.send({ content: t("block:errors.remove.user.bot") });

    return this.collection.doc(msg.author.id).set({
      blockedUsers: this.container.fb.firestore.FieldValue.arrayRemove(user.value.id),
    }, { merge: true })
      .then(() => msg.channel.send({ content: t("block:remove.user", { userName: `\`${user.value.tag}\`` }) }))
      .catch(e => {
        captureException(e);
        msg.channel.send({ content: t("block:errors.remove.user.cantremove") });
      });
  }
}

export default command;
