#!/usr/bin/env node
/**
 * Generates an ADMIN_PASSWORD_HASH for the CMS.
 *
 *   node hash-password.mjs            -> asks for the password (recommended)
 *   node hash-password.mjs 'password' -> takes it from the command line
 *
 * Prefer the first form: the shell interprets characters like $ ! " and \ in
 * quoted arguments, which silently changes the password being hashed. That is
 * the usual reason a freshly generated password "doesn't work".
 */
import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const onData = () => {
      // Redraw the prompt so the typed characters are not echoed.
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(question);
    };
    process.stdin.on("data", onData);
    rl.question(question, (answer) => {
      process.stdin.removeListener("data", onData);
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

let password = process.argv[2];

if (!password) {
  password = await askHidden("New admin password: ");
  const again = await askHidden("Type it again to confirm: ");
  if (password !== again) {
    console.error("\nThose do not match. Nothing was generated - run it again.");
    process.exit(1);
  }
}

if (!password || password.length < 12) {
  console.error("Please choose a password of at least 12 characters.");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const derived = scryptSync(password, salt, 64, { N: 16384 });
const hash = "scrypt$16384$" + salt + "$" + derived.toString("hex");

console.log("\nPaste the line below into Render as ADMIN_PASSWORD_HASH.");
console.log("Copy it WITHOUT any ADMIN_PASSWORD_HASH= prefix:\n");
console.log(hash);
console.log("\nCheck: the value is " + hash.length + " characters long.");
console.log("If SESSION_SECRET is not set yet, use this one:");
console.log("SESSION_SECRET=" + randomBytes(48).toString("hex") + "\n");
