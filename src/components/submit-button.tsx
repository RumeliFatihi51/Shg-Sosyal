"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

export function SubmitButton({
  children,
  pendingLabel = "Kaydediliyor...",
  className,
  variant = "primary",
  disabled,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className={className}
      variant={variant}
      disabled={disabled || pending}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
