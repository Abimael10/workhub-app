"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/date";

type EditableCellProps = {
  value: string | number | Date | null;
  type?: "text" | "select" | "currency" | "date";
  options?: { label: string; value: string }[];
  onSave: (value: string | number | null) => Promise<void> | void;
};

function normalizeDraft(value: string | number | Date | null, type: EditableCellProps["type"]): string {
  if (type === "date") {
    if (!value) return "";
    if (value instanceof Date) {
      const dateStr = value.toISOString();
      return dateStr.split("T")[0] || "";
    }
    const dateValue = new Date(value);
    if (isNaN(dateValue.getTime())) return "";
    const dateStr = dateValue.toISOString();
    return dateStr.split("T")[0] || "";
  }
  return (value ?? "").toString();
}

export function EditableCell({ value, options, type = "text", onSave }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<string>(() => normalizeDraft(value, type) ?? "");

  useEffect(() => {
    setDraft(normalizeDraft(value, type));
  }, [value, type]);

  const displayValue =
    type === "currency"
      ? formatCurrency(Number(value))
      : type === "date"
        ? String(formatDate(value instanceof Date ? value : value ? String(value) : null) ?? "")
        : type === "select"
          ? String(options?.find((option) => option.value === value)?.label ?? value ?? "—")
          : String(value ?? "—");

  const handleSubmit = async () => {
    let nextValue: string | number | null = draft;
    if (type === "currency") {
      nextValue = Number(draft);
    } else if (type === "date") {
      nextValue = draft === "" ? null : draft;
    }
    await onSave(nextValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(normalizeDraft(value, type));
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        {type === "select" ? (
          <select
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="rounded-xl border border-white/10 bg-black/30 px-2 py-1 text-sm text-white focus:border-primary focus:ring-2 focus:ring-primary/30"
          >
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            autoFocus
            type={type === "currency" ? "number" : type === "date" ? "date" : "text"}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-2 py-1 text-sm text-white focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        )}
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-full bg-primary/20 p-1 text-primary hover:bg-primary/40"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-full bg-white/10 p-1 text-muted-foreground hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "group flex w-full items-center justify-between rounded-xl border border-transparent px-2 py-1 text-left text-sm text-white transition hover:border-white/10 hover:bg-white/5",
      )}
      onClick={() => setIsEditing(true)}
    >
      <span>{displayValue}</span>
      <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
    </button>
  );
}
