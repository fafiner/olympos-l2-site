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
