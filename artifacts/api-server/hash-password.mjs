#!/usr/bin/env node
/**
 * Generates an ADMIN_PASSWORD_HASH for the CMS.
 *
 *   node hash-password.mjs 'your new password'
 *
 * Put the printed line in your host's environment variables. The plain
 * password is never stored anywhere.
 */
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error("Usage: node hash-password.mjs 'your new password'");
  process.exit(1);
}
if (password.length < 12) {
  console.error("Please choose a password of at least 12 characters.");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const derived = scryptSync(password, salt, 64, { N: 16384 });

console.log("\nAdd these to your hosting environment variables:\n");
console.log(`ADMIN_PASSWORD_HASH=scrypt$16384$${salt}$${derived.toString("hex")}`);
console.log(`SESSION_SECRET=${randomBytes(48).toString("hex")}\n`);
