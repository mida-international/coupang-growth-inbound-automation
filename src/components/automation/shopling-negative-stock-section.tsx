"use client";

import { useRef, useState } from "react";

import { DeliverablesSection } from "@/components/deliverables/deliverables-section";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api-client";
import type { ShoplingWmsLoginData } from "@/services/shopling-wms-automation/login-shopling-wms";

const RUN_ENDPOINT = "/api/automation/shopling-negative-stock/run";

type RunEvent =
  | { type: "progress"; message: string }
  | {
      type: "result";
      ok: true;
      data: { rowCount: number; memo: string; message?: string };
    }
  | { type: "result"; ok: false; error: string };

export function ShoplingNegativeStockSection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSubtracting, setIsSubtracting] = useState(false);
  const [showPluginGuide, setShowPluginGuide] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [runResult, setRunResult] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function handlePluginInstallClick() {
    const link = document.createElement("a");
    link.href = "/shopling-session-plugin.zip";
    link.download = "shopling-session-plugin.zip";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setShowPluginGuide(true);
  }

  async function handleLoginClick() {
    if (isLoggingIn) {
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await apiPost<ShoplingWmsLoginData>(
        "/api/automation/shopling-negative-stock/login",
        {},
      );

      if (!response.ok) {
        window.alert(response.error);
        return;
      }

      setIsLoggedIn(true);
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleSubtractClick() {
    if (isSubtracting) {
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsSubtracting(true);
    setProgress([]);
    setRunResult(null);

    try {
      const response = await fetch(RUN_ENDPOINT, {
        method: "POST",
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        let message = `요청 실패 (${response.status})`;
        try {
          const body = await response.json();
          if (body?.error) message = body.error;
        } catch {
          // ignore
        }
        setRunResult(`❌ ${message}`);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;

          let event: RunEvent;
          try {
            event = JSON.parse(line) as RunEvent;
          } catch {
            continue;
          }

          if (event.type === "progress") {
            setProgress((prev) => [...prev, event.message]);
          } else if (event.type === "result") {
            if (event.ok) {
              setRunResult(
                event.data.message ??
                  `✅ 완료 — 음수 재고 ${event.data.rowCount}건 반영`,
              );
            } else {
              setRunResult(`❌ ${event.error}`);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setRunResult("⏹ 작업을 중지했습니다.");
      } else {
        setRunResult(
          `❌ ${error instanceof Error ? error.message : "오류가 발생했습니다."}`,
        );
      }
    } finally {
      setIsSubtracting(false);
      abortRef.current = null;
    }
  }

  function handleStopClick() {
    abortRef.current?.abort();
  }

  return (
    <DeliverablesSection
      title="샵플링 재고 음수빼기"
      description="샵플링 WMS 세션으로 음수 재고를 보정합니다."
      variant="plain"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handlePluginInstallClick}
        >
          플러그인 설치
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isLoggingIn || isLoggedIn}
          onClick={handleLoginClick}
        >
          {isLoggingIn ? "로그인 중..." : "로그인"}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isSubtracting}
          onClick={handleSubtractClick}
        >
          {isSubtracting ? "처리 중..." : "재고 음수빼기"}
        </Button>
        {isSubtracting ? (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleStopClick}
          >
            중지
          </Button>
        ) : null}
      </div>

      {isSubtracting || progress.length > 0 || runResult ? (
        <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <p className="mb-2 font-medium">진행 상황</p>
          <ul className="space-y-1 text-muted-foreground">
            {progress.map((step, index) => (
              <li key={index}>• {step}</li>
            ))}
            {isSubtracting ? <li className="animate-pulse">• 진행 중...</li> : null}
          </ul>
          {runResult ? (
            <p className="mt-3 font-medium text-foreground">{runResult}</p>
          ) : null}
        </div>
      ) : null}

      {showPluginGuide ? (
        <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <p className="mb-2 font-medium">
            플러그인 설치 방법 (크롬, 최초 1회)
          </p>
          <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
            <li>
              방금 받은{" "}
              <code className="text-foreground">shopling-session-plugin.zip</code>{" "}
              압축을 풉니다 → <code>shopling-session-plugin</code> 폴더가 생깁니다.
            </li>
            <li>
              크롬 주소창에{" "}
              <code className="text-foreground">chrome://extensions</code> 입력.
            </li>
            <li>
              오른쪽 위 <span className="text-foreground">개발자 모드</span>를 켭니다.
            </li>
            <li>
              <span className="text-foreground">
                &quot;압축해제된 확장 프로그램을 로드&quot;
              </span>{" "}
              클릭 → 압축 푼{" "}
              <code className="text-foreground">shopling-session-plugin</code>{" "}
              폴더 선택.
            </li>
            <li>
              설치 후, 샵플링 WMS와 이 앱에 로그인한 상태에서 확장 아이콘 →{" "}
              <span className="text-foreground">&quot;샵플링 세션 전송&quot;</span>{" "}
              클릭.
            </li>
            <li>그다음부터는 위의 &quot;재고 음수빼기&quot; 버튼만 누르면 됩니다.</li>
          </ol>
        </div>
      ) : null}
    </DeliverablesSection>
  );
}
