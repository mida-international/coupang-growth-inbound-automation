import { cn } from "@/lib/utils";

export function DeliverablesSection({
  title,
  description,
  children,
  variant = "muted",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  variant?: "muted" | "plain";
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border p-4 sm:p-5",
        variant === "muted" ? "bg-muted/50" : "bg-background",
      )}
    >
      <div className="mb-4 flex items-start gap-3 border-b border-border/60 pb-4">
        <span
          className="mt-1 h-4 w-1 shrink-0 rounded-full bg-primary"
          aria-hidden
        />
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}
