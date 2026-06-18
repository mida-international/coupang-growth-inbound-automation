import type { ReactNode } from "react";

export const DELIVERABLES_PRIMARY_BUTTON_CLASS =
  "h-10 min-w-[11rem] px-5";

export function DeliverablesActionBar({
  center,
  end,
}: {
  center: ReactNode;
  end?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-10 w-full items-center">
      <div className="absolute left-1/2">
        <div className="inline-flex items-center gap-2 [&:has(>:nth-child(2))]:-translate-x-[5.5rem] [&:not(:has(>:nth-child(2)))]:-translate-x-1/2">
          {center}
        </div>
      </div>
      {end ? <div className="relative z-10 ml-auto shrink-0">{end}</div> : null}
    </div>
  );
}
