import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { runNegativeStock } from "@/services/shopling-wms-automation/run-negative-stock";

export const maxDuration = 300;

// 진행 상황을 실시간으로 보여주고 중지할 수 있도록 NDJSON 스트리밍으로 응답한다.
// 각 줄: {"type":"progress","message":...} 또는 {"type":"result","ok":...}
export async function POST(request: Request): Promise<Response> {
  const auth = await requireApiProfile();

  if ("response" in auth) {
    return auth.response;
  }

  const userId = auth.profile.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
        } catch {
          // 클라이언트가 끊겼으면 무시
        }
      };

      try {
        const result = await runNegativeStock(userId, {
          signal: request.signal,
          onProgress: (message) => send({ type: "progress", message }),
        });

        if (result.ok) {
          send({ type: "result", ok: true, data: result.data });
        } else {
          send({ type: "result", ok: false, error: result.error });
        }
      } catch (error) {
        logRouteError(error, {
          route: "/api/automation/shopling-negative-stock/run",
          method: "POST",
        });
        send({ type: "result", ok: false, error: "요청 처리에 실패했습니다." });
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
