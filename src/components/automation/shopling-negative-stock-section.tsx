"use client";

import { useState } from "react";

import { DeliverablesSection } from "@/components/deliverables/deliverables-section";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api-client";
import type { ShoplingWmsLoginData } from "@/services/shopling-wms-automation/login-shopling-wms";

export function ShoplingNegativeStockSection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSubtracting, setIsSubtracting] = useState(false);

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
    if (!isLoggedIn || isSubtracting) {
      return;
    }

    setIsSubtracting(true);

    try {
      // API 연동은 후속 커밋
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
          disabled={isLoggingIn || isLoggedIn}
          onClick={handleLoginClick}
        >
          {isLoggingIn ? "로그인 중..." : "로그인"}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!isLoggedIn || isSubtracting}
          onClick={handleSubtractClick}
        >
          {isSubtracting ? "처리 중..." : "재고 음수빼기"}
        </Button>
      </div>
    </DeliverablesSection>
  );
}
