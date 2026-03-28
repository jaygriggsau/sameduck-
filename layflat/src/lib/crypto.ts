import crypto from "node:crypto";

export function randomNumericCode(length: number) {
  const digits = "0123456789";
  let out = "";
  for (let i = 0; i < length; i++) out += digits[crypto.randomInt(0, digits.length)];
  return out;
}

export function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

