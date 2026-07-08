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
  // 넓은 화면: [1fr | center(가운데) | end(오른쪽)] 3열 그리드로 center를 정확히
  // 가운데, end를 오른쪽에 둔다. 버튼이 늘어나거나 화면이 좁아지면 center 안에서
  // 줄바꿈되므로 end와 겹치지 않는다.
  // 좁은 화면(sm 미만): 세로로 쌓아 겹침을 원천 차단한다.
  return (
    <div className="grid min-h-10 w-full grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
      <div className="hidden sm:block" />
      <div className="flex flex-wrap items-center justify-center gap-2">
        {center}
      </div>
      {end ? (
        <div className="flex justify-center sm:justify-end">{end}</div>
      ) : (
        <div className="hidden sm:block" />
      )}
    </div>
  );
}
