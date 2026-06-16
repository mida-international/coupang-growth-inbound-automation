"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function parseIntegerInput(value: string): number {
  const trimmed = value.trim();

  if (trimmed === "") {
    return 0;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.floor(parsed);
}

function isValidIntegerInput(value: string): boolean {
  return value === "" || /^\d+$/.test(value);
}

type EditableIntegerCellProps = {
  value: number;
  editable?: boolean;
  highlighted?: boolean;
  highlightClassName?: string;
  muted?: boolean;
  onChange?: (value: number) => void;
};

export function EditableIntegerCell({
  value,
  editable = false,
  highlighted = false,
  highlightClassName,
  muted = false,
  onChange,
}: EditableIntegerCellProps) {
  const [localValue, setLocalValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(value));
    }
  }, [isFocused, value]);

  function commitValue(raw: string) {
    const next = parseIntegerInput(raw);
    setLocalValue(String(next));
    onChange?.(next);
  }

  if (!editable) {
    return (
      <span
        className={cn(
          "block rounded px-1 py-0.5",
          muted && "text-muted-foreground",
          highlighted && highlightClassName,
        )}
      >
        {value.toLocaleString()}
      </span>
    );
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      className={cn(
        "ml-auto h-8 w-24 text-right",
        highlighted && highlightClassName,
      )}
      value={localValue}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        commitValue(localValue);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
      onChange={(event) => {
        const next = event.target.value;

        if (!isValidIntegerInput(next)) {
          return;
        }

        setLocalValue(next);
      }}
    />
  );
}
