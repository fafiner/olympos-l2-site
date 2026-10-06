import { CLASSES, STYLES } from "../../interest-options.js";
const json = (body, status = 200) => Response.json(body, {status, headers: {"Cache-Control":"no-store"}});
export async function onRequestPost({request, env}) {
  const url = new URL(request.url);
  if (request.headers.get("origin") !== url.origin) return json({code:"origin"},403);
  if (!(request.headers.get("content-type") || "").startsWith("application/json")) return json({code:"format"},415);
  if (Number(request.headers.get("content-length")) > 2048) return json({code:"size"},413);
  let data;
  try { const text = await request.text(); if (text.length > 2048) return json({code:"size"},413); data = JSON.parse(text); }
  catch { return json({code:"invalid"},400); }
  if (!data || typeof data !== "object" || Array.isArray(data)) return json({code:"invalid"},400);
  if (data.website) return json({code:"invalid"},400);
  const nickname = typeof data.nickname === "string" ? data.nickname.trim() : "";
  const styles = Array.isArray(data.styles) ? [...new Set(data.styles)] : [];
  if (!/^[A-Za-z0-9_]{3,16}$/.test(nickname) || !CLASSES.includes(data.className) ||
      !styles.length || styles.length > 3 || styles.some(s => !STYLES.includes(s)) || data.consent !== true) {
    return json({code:"invalid"},400);
  }
  if (!env.INTEREST_DB) return json({code:"unavailable"},503);
  try {
    const db = env.INTEREST_DB;
    await db.batch([
      db.prepare("CREATE TABLE IF NOT EXISTS player_interest (id TEXT PRIMARY KEY, nickname TEXT NOT NULL, nickname_key TEXT UNIQUE NOT NULL, class_name TEXT NOT NULL, styles TEXT NOT NULL, consent_version TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))"),
      db.prepare("CREATE TABLE IF NOT EXISTS interest_rate (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires INTEGER NOT NULL)")
    ]);
    const now = Math.floor(Date.now()/1000);
    const ip = request.headers.get("CF-Connecting-IP");
    if (ip) {
      const bytes = await crypto.subtle.digest("SHA-256",new TextEncoder().encode(ip+":"+Math.floor(now/3600)));
      const key = Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
      await db.prepare("DELETE FROM interest_rate WHERE expires < ?").bind(now).run();
      const rate = await db.prepare("INSERT INTO interest_rate(key,hits,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits").bind(key,now+3600).first();
      if (rate.hits > 10) return json({code:"rate"},429);
    }
    const result = await db.prepare("INSERT INTO player_interest(id,nickname,nickname_key,class_name,styles,consent_version) VALUES(?,?,?,?,?,?) ON CONFLICT(nickname_key) DO NOTHING RETURNING id")
      .bind(crypto.randomUUID(),nickname,nickname.toLowerCase(),data.className,JSON.stringify(styles),"interest-v1").first();
    if (!result) return json({code:"duplicate"},409);
    return json({ok:true},201);
  } catch { return json({code:"unavailable"},503); }
}


