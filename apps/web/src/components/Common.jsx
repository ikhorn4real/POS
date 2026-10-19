import { useEffect, useRef } from "react";
import { ShoppingBag } from "lucide-react";

export function ProductArtwork({ product, compact = false }) {
  return (
    <div
      className={`product-art${compact ? " product-art--compact" : ""}`}
      style={{ "--product-color": product.color }}
      aria-hidden="true"
    >
      <span>{product.initials}</span>
      <ShoppingBag size={compact ? 15 : 19} strokeWidth={1.6} />
    </div>
  );
}

export function AccessibleDialog({
  children,
  labelledBy,
  onDismiss,
  className = "modal-backdrop",
}) {
  const dialogRef = useRef(null);
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement;
    const focusableSelector =
      'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';
    const focusInitial = () => {
      const target =
        (dialog.contains(document.activeElement) &&
        document.activeElement !== dialog
          ? document.activeElement
          : null) ??
        dialog.querySelector("[autofocus]") ??
        dialog.querySelector(
          "input:not(:disabled), select:not(:disabled), textarea:not(:disabled)",
        ) ??
        dialog.querySelector(focusableSelector) ??
        dialog;
      target.focus();
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismissRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...dialog.querySelectorAll(focusableSelector)];
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    focusInitial();
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      if (
        previouslyFocused instanceof HTMLElement &&
        previouslyFocused.isConnected
      ) {
        previouslyFocused.focus();
      }
    };
  }, []);

  return (
    <div
      ref={dialogRef}
      className={className}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismissRef.current?.();
      }}
    >
      {children}
    </div>
  );
}
