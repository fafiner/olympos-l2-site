export async function onRequestGet(context) {
  const response = await context.next();
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("text/html") || response.status === 304) {
    return response;
  }

  const country = context.request.cf?.country ?? "";
  const safeCountry = /^[A-Z]{2}$/.test(country) ? country : "";
  const html = await response.text();
  const localizedHtml = html.replace(
    "<head>",
    `<head><meta name="olympos-visitor-country" content="${safeCountry}">`,
  );
  const headers = new Headers(response.headers);
  headers.set("cache-control", "private, no-store");
  headers.set("content-security-policy", "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://top.l2jbrasil.com https://l2.hopzone.net; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  headers.delete("last-modified");

  return new Response(localizedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
