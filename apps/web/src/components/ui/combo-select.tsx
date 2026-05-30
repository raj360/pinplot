"use client";

import { ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils/cn";

export type ComboSelectOption = {
  value: string;
  label: string;
  shortLabel?: string;
};

type ComboSelectProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboSelectOption[];
  className?: string;
  id?: string;
  /** Placeholder when value is empty — shown inside the trigger. */
  placeholder?: string;
  compact?: boolean;
  /** Highlight trigger when a non-default value is selected. */
  active?: boolean;
};

/** LPMS-style custom combo — button trigger + anchored list (no native select). */
export function ComboSelect({
  label,
  value,
  onChange,
  options,
  className,
  id,
  placeholder,
  compact = true,
  active = false,
}: ComboSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listboxId = `${selectId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selected = options.find((opt) => opt.value === value);
  const triggerLabel =
    selected?.shortLabel ?? selected?.label ?? placeholder ?? options[0]?.label ?? "Select";

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const openPanel = useCallback(() => {
    const index = options.findIndex((opt) => opt.value === value);
    setActiveIndex(index >= 0 ? index : 0);
    setOpen(true);
  }, [options, value]);

  const toggle = useCallback(() => {
    if (open) {
      close();
    } else {
      openPanel();
    }
  }, [close, open, openPanel]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [close, open]);

  function selectOption(nextValue: string) {
    onChange(nextValue);
    close();
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) openPanel();
    }
    if (event.key === "Escape") close();
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectOption(options[activeIndex]?.value ?? "");
    }
  }

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      {label ? (
        <label
          htmlFor={selectId}
          className={cn(
            "mb-0.5 block text-foreground",
            compact ? "text-xs font-medium" : "text-sm",
          )}
        >
          {label}
        </label>
      ) : null}

      <button
        id={selectId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={toggle}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex w-full min-w-0 items-center justify-between gap-2 border bg-surface text-left text-foreground transition-colors",
          active && value
            ? "border-primary/45 bg-primary/5"
            : "border-border",
          "hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/25",
          compact ? "min-h-9 px-2.5 py-1.5 text-sm" : "min-h-10 px-3 py-2 text-sm",
        )}
      >
        <span className={cn("min-w-0 truncate", !selected && placeholder && "text-muted")}>
          {triggerLabel}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3.5 shrink-0 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={selectId}
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          className="absolute z-[60] mt-0.5 max-h-52 min-w-full w-max max-w-[min(100vw-2rem,20rem)] overflow-y-auto border border-border bg-surface py-0.5 shadow-md"
        >
          {options.map((opt, index) => {
            const isSelected = opt.value === value;
            const isActive = index === activeIndex;
            return (
              <li key={opt.value || "any"} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(opt.value)}
                  className={cn(
                    "flex w-full px-2.5 py-1.5 text-left text-sm",
                    isSelected && "font-medium text-primary",
                    isActive && !isSelected && "bg-background",
                    !isActive && !isSelected && "text-foreground hover:bg-background",
                  )}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
