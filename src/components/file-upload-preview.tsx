"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 3 * 1024 * 1024;

export function FileUploadPreview({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        ref={inputRef}
        name={name}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="rounded-md border border-[var(--border-soft)] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-orange-50 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-[#f05a28]"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];

          if (preview) {
            URL.revokeObjectURL(preview);
          }

          if (!file) {
            setPreview(null);
            setError(null);
            return;
          }

          if (!ACCEPTED_TYPES.includes(file.type)) {
            setPreview(null);
            setError("Sadece JPG, PNG veya WebP görsel yükleyebilirsin.");
            if (inputRef.current) {
              inputRef.current.value = "";
            }
            return;
          }

          if (file.size > MAX_SIZE) {
            setPreview(null);
            setError("Görsel en fazla 3MB olabilir.");
            if (inputRef.current) {
              inputRef.current.value = "";
            }
            return;
          }

          setError(null);
          setPreview(URL.createObjectURL(file));
        }}
      />
      <span className="text-xs font-medium text-slate-500">
        JPG, PNG veya WebP. Maksimum 3MB.
      </span>
      {error ? (
        <span className="rounded-md bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
          {error}
        </span>
      ) : null}
      {preview ? (
        <img
          src={preview}
          alt=""
          className="aspect-video w-full rounded-md border border-[var(--border-soft)] object-cover"
        />
      ) : null}
    </label>
  );
}
