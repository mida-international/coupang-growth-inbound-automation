import "server-only";

import https from "node:https";

// Shopling API uses 1024-bit DH keys; OpenSSL 3 (Node 24+) rejects them at SECLEVEL=2.
// Exclude DHE ciphers so the handshake negotiates ECDHE instead.
const SHOPLING_TLS_CIPHERS = "DEFAULT:!DH";

export type ShoplingApiPostResult = {
  status: number;
  body: string;
};

// 한 요청이 응답 없이 멈추면(행) 전체 동기화가 함수 제한시간(300s)까지 매달려
// 504로 죽는다. 청크당 상한을 둬서 멈춘 요청은 빨리 실패하게 한다.
const SHOPLING_REQUEST_TIMEOUT_MS = 60_000;

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
        timeout: SHOPLING_REQUEST_TIMEOUT_MS,
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

    // 소켓이 지정 시간 동안 멈춰 있으면 요청을 끊어 에러로 반환한다.
    req.on("timeout", () => {
      req.destroy(
        new Error(
          `샵플링 API 응답 시간 초과 (${SHOPLING_REQUEST_TIMEOUT_MS / 1000}초)`,
        ),
      );
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}
