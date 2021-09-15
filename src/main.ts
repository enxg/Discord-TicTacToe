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
import { fetchT } from "@sapphire/plugin-i18next";
import Sentry from "@sentry/node";
import Tracing from "@sentry/tracing";

type Opaque<T, K extends string> = T & { __typename: K }
type Base64 = Opaque<string, "base64">

dotenv.config({ path: `${process.cwd()}/.env` });

const firebaseToken: Base64 = process.env.FIREBASE_TOKEN as Base64;

firebase.initializeApp({
  credential: firebase.credential.cert(JSON.parse(Buffer.from(firebaseToken, "base64").toString("utf-8"))),
});
const firestore = firebase.firestore();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

const client = new SapphireClient({
  shards: "auto",
  intents: ["GUILD_INTEGRATIONS", "GUILDS", "GUILD_MESSAGES"],
  presence: {
    activities: [
      {
        name: "Tic-Tac-Toe | t.help | ttt.infinixlabs.xyz",
        type: "PLAYING",
      },
    ],
  },
  defaultPrefix: "t.",
  allowedMentions: {},
  i18n: {
    i18next: {
      ns: ["common", "play", "block", "language", "help", "invite"],
      defaultNS: "common",
      load: "all",
      fallbackLng: "en-US",
      lng: "en-US",
    },
    defaultNS: "common",
    async fetchLanguage(ctx) {
      if (!ctx.guild) return "en-US";
      const language = await firestore.collection("languages").doc(ctx.guild.id).get();
      return language.exists ? await language.data()!["language"] as string : "en-US";
    },
  },
});

container.db = firestore;
container.fb = firebase;
container.fetchT = fetchT;
container.sentry = Sentry;

declare module "@sapphire/pieces" {
  interface Container {
    db: FirebaseFirestore.Firestore,
    fb: typeof firebase,
    fetchT: typeof fetchT,
    sentry: typeof Sentry,
  }
}

declare module "@sapphire/framework" {
  interface ArgType {
    language: string,
  }

  interface Preconditions {
    "OwnerOnly": never,
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
