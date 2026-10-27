"use client";

import { useEffect } from "react";

/**
 * 브라우저가 2초 넘게 멈춘 프레임(long-animation-frame)을 서버 로그로 보낸다.
 * - 멈춘 동안 돌던 스크립트(있으면 함수·파일·위치)와 직전 사용자 동작 시각, 주소, UA를 함께 보낸다.
 * - 스크립트가 0건이면 페이지 코드 밖(브라우저·확장 프로그램)에서 멈춘 것.
 * - 2026-10-27 「왼쪽 메뉴 누르면 몇 분 멈춤」 추적용. 화면에는 아무것도 그리지 않는다.
 */
const LONG_FRAME_MS = 2000;

type LoafScript = {
  duration: number;
  invoker?: string;
  invokerType?: string;
  sourceFunctionName?: string;
  sourceURL?: string;
  sourceCharPosition?: number;
  pauseDuration?: number;
  forcedStyleAndLayoutDuration?: number;
};

type LoafEntry = PerformanceEntry & {
  blockingDuration?: number;
  renderStart?: number;
  styleAndLayoutStart?: number;
  firstUIEventTimestamp?: number;
  scripts?: LoafScript[];
};

function send(payload: unknown): void {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon?.("/api/diag/long-frame", body)) {
      return;
    }
  } catch {
    // sendBeacon 실패 시 fetch로
  }
  void fetch("/api/diag/long-frame", {
    method: "POST",
    body,
    keepalive: true,
    headers: { "content-type": "application/json" },
  }).catch(() => undefined);
}

export function LongFrameReporter() {
  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") {
      return;
    }
    const supported = PerformanceObserver.supportedEntryTypes ?? [];
    if (!supported.includes("long-animation-frame")) {
      return;
    }

    let lastPointer = "";
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      lastPointer = `${Math.round(event.timeStamp)} ${target?.tagName ?? "?"}${
        anchor ? ` a[href=${anchor.getAttribute("href")}]` : ""
      } "${(target?.textContent ?? "").trim().slice(0, 30)}"`;
    };
    document.addEventListener("pointerdown", onPointerDown, true);

    const observer = new PerformanceObserver((list) => {
      for (const raw of list.getEntries()) {
        const entry = raw as LoafEntry;
        if (entry.duration < LONG_FRAME_MS) {
          continue;
        }
        send({
          at: new Date().toISOString(),
          url: location.pathname + location.search,
          ua: navigator.userAgent,
          lastPointer,
          startTime: Math.round(entry.startTime),
          duration: Math.round(entry.duration),
          blocking: Math.round(entry.blockingDuration ?? 0),
          renderStart: Math.round(entry.renderStart ?? 0),
          styleAndLayoutStart: Math.round(entry.styleAndLayoutStart ?? 0),
          firstUIEvent: Math.round(entry.firstUIEventTimestamp ?? 0),
          scripts: (entry.scripts ?? []).slice(0, 10).map((script) => ({
            duration: Math.round(script.duration),
            invoker: script.invoker,
            invokerType: script.invokerType,
            fn: script.sourceFunctionName,
            file: script.sourceURL?.split("/").pop(),
            pos: script.sourceCharPosition,
            pause: Math.round(script.pauseDuration ?? 0),
            forcedLayout: Math.round(script.forcedStyleAndLayoutDuration ?? 0),
          })),
        });
      }
    });

    try {
      observer.observe({ type: "long-animation-frame", buffered: true });
    } catch {
      return;
    }

    return () => {
      observer.disconnect();
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  return null;
}
