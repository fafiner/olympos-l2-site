const PATH = "/api/account/password/change";
const MAX_REQUEST_BYTES = 4096;

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function getBridge(env) {
  if (env.ACCOUNT_PASSWORDS_ENABLED !== "true" || !env.ACCOUNT_BRIDGE_URL || !env.ACCOUNT_BRIDGE_TOKEN) return null;

  try {
    const url = new URL(env.ACCOUNT_BRIDGE_URL);
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    if (env.ACCOUNT_BRIDGE_TOKEN.length < 48) return null;
    return { origin: url.origin, token: env.ACCOUNT_BRIDGE_TOKEN };
  } catch {
    return null;
  }
}

async function callBridge(bridge, path, init = {}) {
  return fetch(new URL(path, bridge.origin), {
    ...init,
    headers: {
      Authorization: `Bearer ${bridge.token}`,
      Accept: "application/json",
      ...init.headers,
    },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(8000),
  });
}

export async function onRequestGet({ env }) {
  const bridge = getBridge(env);
  if (!bridge) return json({ available: false }, 503);

  try {
    const response = await callBridge(bridge, "/health");
    const result = await response.json();
    return response.ok && result.ready === true
      ? json({ available: true })
      : json({ available: false }, 503);
  } catch {
    return json({ available: false }, 503);
  }
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin) return json({ ok: false }, 403);
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("Content-Type") ?? "")) return json({ ok: false }, 415);

  const declaredLength = Number(request.headers.get("Content-Length") ?? 0);
  if (declaredLength > MAX_REQUEST_BYTES) return json({ ok: false }, 413);

  let input;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_REQUEST_BYTES) return json({ ok: false }, 413);
    input = JSON.parse(body);
  } catch {
    return json({ ok: false }, 400);
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return json({ ok: false }, 400);

  const account = typeof input.account === "string" ? input.account.trim() : "";
  const currentPassword = typeof input.currentPassword === "string" ? input.currentPassword : "";
  const newPassword = typeof input.newPassword === "string" ? input.newPassword : "";
  if (!/^[A-Za-z0-9_.-]{1,45}$/.test(account) || currentPassword.length < 1 || currentPassword.length > 64 || newPassword.length < 8 || newPassword.length > 64) {
    return json({ ok: false }, 400);
  }

  const bridge = getBridge(env);
  if (!bridge) return json({ ok: false }, 503);

  try {
    const body = new URLSearchParams({ account, currentPassword, newPassword });
    const response = await callBridge(bridge, "/api/account/password/change", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body,
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok && result.ok === true) return json({ ok: true });
    if (response.status === 429) return json({ ok: false }, 429);
    if (response.status === 400 || response.status === 401 || response.status === 403) return json({ ok: false }, 400);
    return json({ ok: false }, 503);
  } catch {
    return json({ ok: false }, 503);
  }
}
