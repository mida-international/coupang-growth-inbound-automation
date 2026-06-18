import { cn } from "@/lib/utils";

const boardAuthorStyles: Record<
  string,
  { initials: string; className: string }
> = {
  관리자: {
    initials: "관",
    className: "bg-primary text-primary-foreground",
  },
  "U2DIA 개발자": {
    initials: "U2",
    className: "bg-blue-600 text-white",
  },
  MIZCOS: {
    initials: "MZ",
    className: "bg-emerald-600 text-white",
  },
  김주웅: {
    initials: "김",
    className: "bg-violet-600 text-white",
  },
  "AI 시스템": {
    initials: "AI",
    className: "bg-amber-600 text-white",
  },
  시스템: {
    initials: "SY",
    className: "bg-slate-600 text-white",
  },
};

export function getBoardAuthorStyle(author: string) {
  return (
    boardAuthorStyles[author] ?? {
      initials: author.slice(0, 2),
      className: "bg-muted text-foreground",
    }
  );
}

type BoardAuthorAvatarProps = {
  author: string;
  className?: string;
};

export function BoardAuthorAvatar({ author, className }: BoardAuthorAvatarProps) {
  const { initials, className: avatarClassName } = getBoardAuthorStyle(author);

  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        avatarClassName,
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
