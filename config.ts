type EnvKey =
  | "TWITCH_CLIENT_ID"
  | "TWITCH_TOKEN"
  | "TWITCH_USERNAME"
  | "TWITCH_CHANNEL";

function readEnv(key: EnvKey): string {
  const value = (Bun.env[key] ?? process.env[key] ?? "").trim();

  if (!value) {
    throw new Error(`Fehlender Wert "${key}" in der .env Datei`);
  }

  return value;
}

export function getClientId(): string {
  return readEnv("TWITCH_CLIENT_ID");
}

export function getToken(): string {
  return readEnv("TWITCH_TOKEN");
}

export function getUsername(): string {
  return readEnv("TWITCH_USERNAME");
}

export function getChannel(): string {
  return readEnv("TWITCH_CHANNEL");
}
