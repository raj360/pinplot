"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export const BUILDING_COVER_MAX_BYTES = 5 * 1024 * 1024;

const BUILDING_COVER_MIME_TYPES = new Set(["image/jpeg", "image/png"]);

export function validateBuildingCoverFile(file: File): string | null {
  if (!BUILDING_COVER_MIME_TYPES.has(file.type)) {
    return "Use a JPEG or PNG image.";
  }
  if (file.size > BUILDING_COVER_MAX_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  return null;
}

type ImageUploadProps = {
  value: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  hint?: string;
  required?: boolean;
  error?: string | null;
  onValidationError?: (message: string | null) => void;
};

export function ImageUpload({
  value,
  onChange,
  label = "Cover photo",
  hint = "Required — JPEG or PNG, up to 5 MB.",
  required = false,
  error,
  onValidationError,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = error ?? localError;

  const previewUrl = useMemo(() => {
    if (!value) return null;
    return URL.createObjectURL(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const pickFile = useCallback(
    (file: File | null) => {
      if (!file) {
        setLocalError(null);
        onValidationError?.(null);
        onChange(null);
        return;
      }

      const validationError = validateBuildingCoverFile(file);
      if (validationError) {
        setLocalError(validationError);
        onValidationError?.(validationError);
        onChange(null);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      setLocalError(null);
      onValidationError?.(null);
      onChange(file);
    },
    [onChange, onValidationError],
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>

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
        accept="image/jpeg,image/png"
        className="sr-only"
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />

      {displayError ? (
        <p className="text-xs text-red-600" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  );
}
