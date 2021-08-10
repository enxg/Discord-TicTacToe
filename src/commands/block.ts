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
import { Message, MessageEmbed } from "discord.js";

type id = string | `${bigint}`;

class command extends SubCommandPluginCommand {
  private collection: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;

  constructor(context: PieceContext) {
    super(context, {
      name: "block",
      description: "Block/unblock a user or see the users you blocked before.",
      subCommands: ["add", "remove", { input: "list", default: true }],
      flags: ["guild"],
    });

    this.collection = this.container.db.collection("blocks");
  }

  async listUser(list: FirebaseFirestore.DocumentData | undefined) {
    if (!list || list["blockedUsers"] == null || list["blockedUsers"].length === 0) return ["You didn't block any users."];

    // eslint-disable-next-line prefer-destructuring
    const blockedUsers: id[] = list["blockedUsers"];
    return Promise.all(blockedUsers.map(async (u: id) => {
      const user = await this.container.client.users.fetch(u as `${bigint}`);
      return `${user?.tag ?? "Can't fetch the user"} - ${u}`;
    }));
  }

  async listGuild(list: FirebaseFirestore.DocumentData | undefined) {
    if (!list || list["blockedGuilds"] == null || list["blockedGuilds"].length === 0) return ["You didn't block any guilds."];

    // eslint-disable-next-line prefer-destructuring
    const blockedGuilds: id[] = list["blockedGuilds"];
    return Promise.all(blockedGuilds.map(async (u: id) => {
      const guild = await this.container.client.guilds.fetch(u as `${bigint}`);
      return `${guild?.name ?? "Can't fetch the guild"} - ${u}`;
    }));
  }

  async list(msg: Message) {
    const doc = await this.collection.doc(msg.author.id).get();

    if (!doc.exists) return msg.channel.send({ content: "You didn't block any user/guild before." });

    const blocklist = doc.data();
    const blockedUsers = await this.listUser(blocklist);
    const blockedGuilds = await this.listGuild(blocklist);

    this.container.logger.info(blockedUsers);
    this.container.logger.info(blockedGuilds);

    const embed = new MessageEmbed()
      .setTitle("Your blocklist")
      .addField("Blocked Users", blockedUsers.join("\n"))
      .addField("Blocked Guilds", blockedGuilds.join("\n"))
      .setTimestamp();

    return msg.channel.send({ embeds: [embed] });
  }

  async add(msg: Message, args: Args) {
    if (args.getFlags("guild")) {
      return this.collection.doc(msg.author.id).set({
        blockedGuilds: this.container.fb.firestore.FieldValue.arrayUnion(msg.guild?.id),
      }, { merge: true })
        .then(() => msg.channel.send({ content: `Added guild named ${msg.guild?.name} to your blocklist.` }))
        .catch(() => msg.channel.send({ content: "An error occurred while adding guild to your blocklist, please contact us." }));
    }

    const user = await args.pickResult("user");

    if (!user.success) return msg.channel.send({ content: "No user specified." });
    if (user.value.id === msg.author.id) return msg.channel.send({ content: "You can't block yourself, dummy." });
    if (user.value.bot) return msg.channel.send({ content: "You can't block a bot." });

    return this.collection.doc(msg.author.id).set({
      blockedUsers: this.container.fb.firestore.FieldValue.arrayUnion(user.value.id),
    }, { merge: true })
      .then(() => msg.channel.send({ content: `Added \`${user.value.tag}\` to your blocklist.` }))
      .catch(() => msg.channel.send({ content: "An error occurred while adding user to your blocklist, please contact us." }));
  }

  async remove(msg: Message, args: Args) {
    if (args.getFlags("guild")) {
      return this.collection.doc(msg.author.id).set({
        blockedGuilds: this.container.fb.firestore.FieldValue.arrayRemove(msg.guild?.id),
      }, { merge: true })
        .then(() => msg.channel.send({ content: `Removed guild named \`${msg.guild?.name}\` from your blocklist.` }))
        .catch(() => msg.channel.send({ content: "An error occured while removing guild from your blocklist, please contact us." }));
    }

    const user = await args.pickResult("user");

    if (!user.success) return msg.channel.send({ content: "No user specified." });
    if (user.value.id === msg.author.id) return msg.channel.send({ content: "You can't block/unblock yourself, dummy." });
    if (user.value.bot) return msg.channel.send({ content: "You can't block/unblock a bot." });

    return this.collection.doc(msg.author.id).set({
      blockedUsers: this.container.fb.firestore.FieldValue.arrayRemove(user.value.id),
    }, { merge: true })
      .then(() => msg.channel.send({ content: `Removed \`${user.value.tag}\` from your blocklist.` }))
      .catch(() => msg.channel.send({ content: "An error occurred while removing user from your blocklist, please contact us." }));
  }
}

export default command;
