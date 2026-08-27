#!/usr/bin/env node
/**
 * Checks a password against an ADMIN_PASSWORD_HASH - the same check the server
 * runs at login. Use it to confirm the value sitting in Render matches the
 * password you are typing, without touching the live site.
 *
 *   node verify-password.mjs
 *   node verify-password.mjs 'scrypt$16384$...' 'the password'
 */
import { scryptSync, timingSafeEqual } from "node:crypto";
import { createInterface } from "node:readline/promises";

function check(hash, password) {
  if (hash.startsWith("ADMIN_PASSWORD_HASH=")) {
    return "NO - the value still has the ADMIN_PASSWORD_HASH= prefix on it.\n" +
      "In Render the box should contain only the part starting with scrypt$.";
  }
  if (!hash.startsWith("scrypt$")) {
    return "NO - that does not look like a hash. It should start with scrypt$16384$.";
  }
  const [, cost, salt, expected] = hash.split("$");
  if (!cost || !salt || !expected) {
    return "NO - the hash looks truncated. It should have four parts separated by $, about 174 characters in total.";
  }

  const expectedBuf = Buffer.from(expected, "hex");
  const derived = scryptSync(password, salt, expectedBuf.length, { N: Number(cost) });
  const ok = derived.length === expectedBuf.length && timingSafeEqual(derived, expectedBuf);

  return ok
    ? "MATCH - this password works with this hash.\n" +
      "If login still fails, the hash in Render is not the one you pasted here,\n" +
      "or you are temporarily rate limited after several failed attempts."
    : "NO MATCH - this hash was generated from a different password.\n" +
      "Generate a new one with: node artifacts/api-server/hash-password.mjs";
}

let [hash, password] = process.argv.slice(2);

if (!hash || !password) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  hash = (await rl.question("Paste the ADMIN_PASSWORD_HASH value from Render:\n")).trim();
  password = await rl.question("\nType the password you are trying to log in with:\n");
  rl.close();
}

console.log("\n" + check(hash.trim(), password));
