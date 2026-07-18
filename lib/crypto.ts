import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// AES-256-GCM field-level encryption.
// Encrypted values are prefixed with "enc:" so plaintext legacy rows
// are returned as-is (safe during migration).

const PREFIX = "enc:";

function key(): Buffer {
  const k = process.env.ENCRYPTION_KEY;
  if (!k) throw new Error("ENCRYPTION_KEY env var is not set");
  return Buffer.from(k, "hex");
}

export function encrypt(value: string | null | undefined): string | null {
  if (value == null || value === "") return value ?? null;
  if (value.startsWith(PREFIX)) return value; // already encrypted
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, body]).toString("base64");
}

export function decrypt(value: string | null | undefined): string | null {
  if (value == null || !value.startsWith(PREFIX)) return value ?? null;
  try {
    const buf = Buffer.from(value.slice(PREFIX.length), "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const body = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
  } catch {
    return value; // corrupted or pre-migration plaintext — return as-is
  }
}
