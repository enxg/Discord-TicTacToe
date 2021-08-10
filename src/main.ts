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

import dotenv from "dotenv";
import firebase from "firebase-admin";
import "@sapphire/plugin-i18next/register";
import { SapphireClient, container } from "@sapphire/framework";

type Opaque<T, K extends string> = T & { __typename: K }
type Base64 = Opaque<string, "base64">

dotenv.config({ path: `${process.cwd()}/.env` });

const firebaseToken: Base64 = process.env.FIREBASE_TOKEN as Base64;

firebase.initializeApp({
  credential: firebase.credential.cert(JSON.parse(Buffer.from(firebaseToken, "base64").toString("utf-8"))),
});

const client = new SapphireClient({
  shards: "auto",
  intents: ["GUILD_INTEGRATIONS", "GUILD_MEMBERS", "GUILDS", "GUILD_MESSAGES"],
  presence: {
    activities: [
      {
        name: "Tic-Tac-Toe",
        type: "PLAYING",
      },
    ],
  },
  defaultPrefix: "t.",
  allowedMentions: {},
});

container.db = firestore;
container.fb = firebase;

declare module "@sapphire/pieces" {
  interface Container {
    db: FirebaseFirestore.Firestore,
    fb: typeof firebase,
  }
}

client.login(process.env.TOKEN)
  .then(() => {
    client.logger.info(`
      ██╗██╗░░██╗  ██╗░░░░░░█████╗░██████╗░░██████╗
      ██║╚██╗██╔╝  ██║░░░░░██╔══██╗██╔══██╗██╔════╝
      ██║░╚███╔╝░  ██║░░░░░███████║██████╦╝╚█████╗░
      ██║░██╔██╗░  ██║░░░░░██╔══██║██╔══██╗░╚═══██╗
      ██║██╔╝╚██╗  ███████╗██║░░██║██████╦╝██████╔╝
      ╚═╝╚═╝░░╚═╝  ╚══════╝╚═╝░░╚═╝╚═════╝░╚═════╝░
    `);
  })
  .catch(err => {
    client.logger.fatal(err);
    process.exit(1);
  });
