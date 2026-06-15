"use client";

import * as React from "react";

import { useSidebar } from "@/components/ui/sidebar";

const CLOSE_DELAY_MS = 300;

type SidebarInteractionContextValue = {
  hoverHandlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
  sidebarInteractionHandlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onClick: (event: React.MouseEvent) => void;
  };
  openSidebar: () => void;
  scheduleClose: () => void;
  pinSidebar: () => void;
  unpinSidebar: () => void;
  isPinned: boolean;
};

const SidebarInteractionContext =
  React.createContext<SidebarInteractionContextValue | null>(null);

function isInsideSidebarInteraction(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest('[data-slot="sidebar-container"]') ||
      target.closest('[data-sidebar="sidebar"]') ||
      target.closest('[data-slot="sidebar-trigger"]') ||
      target.closest('[data-sidebar="trigger"]'),
  );
}

function isSidebarNavigationTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest("a[href]"));
}

export function SidebarInteractionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setOpen } = useSidebar();
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPinnedRef = React.useRef(false);
  const [isPinned, setIsPinned] = React.useState(false);

  const clearCloseTimer = React.useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openSidebar = React.useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer, setOpen]);

  const scheduleClose = React.useCallback(() => {
    if (isPinnedRef.current) {
      return;
    }

    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      if (!isPinnedRef.current) {
        setOpen(false);
      }
      closeTimerRef.current = null;
    }, CLOSE_DELAY_MS);
  }, [clearCloseTimer, setOpen]);

  const pinSidebar = React.useCallback(() => {
    isPinnedRef.current = true;
    setIsPinned(true);
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer, setOpen]);

  const unpinSidebar = React.useCallback(() => {
    isPinnedRef.current = false;
    setIsPinned(false);
    clearCloseTimer();
    setOpen(false);
  }, [clearCloseTimer, setOpen]);

  React.useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, [clearCloseTimer]);

  React.useEffect(() => {
    if (!isPinned) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (isInsideSidebarInteraction(event.target)) {
        return;
      }

      unpinSidebar();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isPinned, unpinSidebar]);

  const value = React.useMemo<SidebarInteractionContextValue>(
    () => ({
      hoverHandlers: {
        onMouseEnter: openSidebar,
        onMouseLeave: scheduleClose,
      },
      sidebarInteractionHandlers: {
        onMouseEnter: openSidebar,
        onMouseLeave: scheduleClose,
        onClick: (event) => {
          if (isSidebarNavigationTarget(event.target)) {
            return;
          }

          pinSidebar();
        },
      },
      openSidebar,
      scheduleClose,
      pinSidebar,
      unpinSidebar,
      isPinned,
    }),
    [
      openSidebar,
      scheduleClose,
      pinSidebar,
      unpinSidebar,
      isPinned,
    ],
  );

  return React.createElement(
    SidebarInteractionContext.Provider,
    { value },
    children,
  );
}

export function useSidebarInteraction() {
  const context = React.useContext(SidebarInteractionContext);
  if (!context) {
    throw new Error(
      "useSidebarInteraction must be used within SidebarInteractionProvider.",
    );
  }

  return context;
}

/** @deprecated Use useSidebarInteraction instead */
export function useSidebarHover() {
  return useSidebarInteraction();
}
