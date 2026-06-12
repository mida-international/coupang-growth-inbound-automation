import "server-only";

import https from "node:https";

// Shopling API uses 1024-bit DH keys; OpenSSL 3 (Node 24+) rejects them at SECLEVEL=2.
// Exclude DHE ciphers so the handshake negotiates ECDHE instead.
const SHOPLING_TLS_CIPHERS = "DEFAULT:!DH";

export type ShoplingApiPostResult = {
  status: number;
  body: string;
};

export async function postShoplingApi(
  url: string,
  requestXml: string,
  extraHeaders?: Record<string, string>,
): Promise<ShoplingApiPostResult> {
  const parsedUrl = new URL(url);
  const body = Buffer.from(requestXml, "utf-8");

  const headers: Record<string, string> = {
    "Content-Type": "application/xml; charset=UTF-8",
    "Content-Length": String(body.byteLength),
    ...extraHeaders,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method: "POST",
        headers,
        ciphers: SHOPLING_TLS_CIPHERS,
        minVersion: "TLSv1.2",
        servername: parsedUrl.hostname,
      },
      (res) => {
        const chunks: Buffer[] = [];

        res.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });

        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf-8"),
          });
        });
      },
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}
