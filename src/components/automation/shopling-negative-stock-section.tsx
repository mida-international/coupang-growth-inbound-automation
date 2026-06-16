"use client";

import { useState } from "react";

import { DeliverablesSection } from "@/components/deliverables/deliverables-section";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api-client";
import type { ShoplingWmsLoginData } from "@/services/shopling-wms-automation/login-shopling-wms";
import type { NegativeStockRunData } from "@/services/shopling-wms-automation/run-negative-stock";

export function ShoplingNegativeStockSection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSubtracting, setIsSubtracting] = useState(false);
  const [showPluginGuide, setShowPluginGuide] = useState(false);

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

    setIsSubtracting(true);

    try {
      const response = await apiPost<NegativeStockRunData>(
        "/api/automation/shopling-negative-stock/run",
        {},
      );

      if (!response.ok) {
        window.alert(response.error);
        return;
      }

      const { rowCount, memo, message, runDir } = response.data;
      const summary =
        message ??
        `처리 완료: ${rowCount}건\n메모: ${memo}\n작업 폴더: ${runDir}`;

      window.alert(summary);
    } finally {
      setIsSubtracting(false);
    }
  }

  return (
    <DeliverablesSection
      title="샵플링 재고 음수빼기"
      description="샵플링 WMS 로그인 후 음수 재고를 보정합니다."
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
      </div>

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
