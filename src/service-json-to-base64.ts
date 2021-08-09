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

/* eslint-disable */

import { readFileSync, writeFileSync } from "fs";

try {
  const file = readFileSync(`${process.cwd()}/key.json`, "utf-8");
  console.log("Encoding file");
  const base64d = Buffer.from(file).toString("base64");
  console.log("Encoded file\nVerifying");
  if (file === Buffer.from(base64d, "base64").toString("utf-8")) {
    console.log(`Verified, writing to file "key.txt"`);
    writeFileSync(`${process.cwd()}/key.txt`, base64d);
    console.log('Writed to "key.txt"\nAdd this to env variable named "FIREBASE_TOKEN"')
  } else {
    console.log("Can't verify.");
  }
} catch (e) {
  console.log(e);
  process.exit(1);
}
