"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

type ImageUploadProps = {
  value: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  hint?: string;
};

export function ImageUpload({
  value,
  onChange,
  label = "Cover photo",
  hint = "JPEG or PNG, up to 5 MB. Drag and drop or click to choose.",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const pickFile = useCallback(
    (file: File | null) => {
      if (!file) {
        onChange(null);
        return;
      }
      if (!file.type.startsWith("image/")) return;
      onChange(file);
    },
    [onChange],
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm">{label}</span>

      {previewUrl ? (
        <div className="relative overflow-hidden border border-border bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Cover preview"
            className="max-h-64 w-full object-cover"
          />
          <div className="flex gap-2 border-t border-border p-2">
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </button>
            <button
              type="button"
              className="text-sm text-muted hover:text-red-600"
              onClick={() => pickFile(null)}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 border border-dashed px-4 py-10 text-center text-sm transition-colors",
            dragOver
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-surface text-muted hover:border-primary/40",
          )}
        >
          <span className="font-medium text-foreground">Drop photo here</span>
          <span>{hint}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
