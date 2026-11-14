import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const restUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const restToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const useKv = Boolean(restUrl && restToken);

function assertStorage(): void {
  if (process.env.VERCEL && !useKv) {
    throw new Error(
      "Penyimpanan belum diset: tambahkan UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN di Vercel",
    );
  }
}

async function kvCommand(command: unknown[]): Promise<unknown> {
  const res = await fetch(restUrl!, {
    method: "POST",
    headers: { Authorization: `Bearer ${restToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (!res.ok || json.error) throw new Error(`Penyimpanan gagal: ${json.error ?? `HTTP ${res.status}`}`);
  return json.result;
}

function localPath(name: string): string {
  return path.join(process.cwd(), "data", `${name}.json`);
}

export async function readJson<T>(name: string): Promise<T | null> {
  assertStorage();
  if (useKv) {
    const raw = await kvCommand(["GET", `duwek:${name}`]);
    return typeof raw === "string" ? (JSON.parse(raw) as T) : null;
  }
  try {
    return JSON.parse(await readFile(localPath(name), "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function writeJson(name: string, value: unknown): Promise<void> {
  assertStorage();
  const raw = JSON.stringify(value);
  if (useKv) {
    await kvCommand(["SET", `duwek:${name}`, raw]);
    return;
  }
  await mkdir(path.dirname(localPath(name)), { recursive: true });
  await writeFile(localPath(name), raw, "utf8");
}
