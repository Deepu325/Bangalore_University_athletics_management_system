// ==========================================
// ScoreInputs.js — FINAL STABLE VERSION
// Supports:
// - Fixed 8-digit HH:MM:SS:ML auto-format
// - Right-aligned padding
// - DNF / DIS (Option B.2)
// - No cursor jump
// - No value disappearing
// - Commit on blur
// ==========================================

import React, { useRef, forwardRef } from "react";

// =============================
// TIME INPUT (Option B.2)
// =============================
export const TimeInput = forwardRef(({ athleteId, defaultValue = "", onCommit, onKeyDown, disabled = false }, ref) => {
  const internalRef = useRef(null);
  const inputRef = ref || internalRef;

  const handleInput = () => {
    const input = inputRef.current;
    if (!input) return;

    let val = input.value.toUpperCase();

    // DNF / DIS allowed
    if (val.startsWith("D")) {
      if (["D", "DN", "DNF", "DIS"].some(x => val.startsWith(x))) {
        return; // allow typing DNF/DIS
      }
    }

    // Extract digits
    let digits = val.replace(/\D/g, "").slice(0, 8);

    // Always pad left → 8 digits
    digits = digits.padStart(8, "0");

    // Build HH:MM:SS:ML
    const formatted =
      digits.slice(0, 2) + ":" +
      digits.slice(2, 4) + ":" +
      digits.slice(4, 6) + ":" +
      digits.slice(6, 8);

    // Capture cursor
    const cursor = input.selectionStart;

    // Update value
    input.value = formatted;

    // Restore cursor smartly
    requestAnimationFrame(() => {
      let pos = cursor;
      if (formatted[pos] === ":") pos++;
      if (pos > formatted.length) pos = formatted.length;
      input.setSelectionRange(pos, pos);
    });
  };

  const handleBlur = () => {
    const input = inputRef.current;
    if (onCommit && input) onCommit(athleteId, input.value);
  };

  const handleKeyDown = (e) => {
    if (onKeyDown) {
      onKeyDown(e, athleteId);
    }
  };

  return (
    <input
      ref={inputRef}
      defaultValue={defaultValue}
      onInput={handleInput}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      inputMode="text"
      maxLength={12}
      placeholder="00:00:00:00 / DNF / DIS"
      className="border rounded p-1 text-center font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
      style={{ width: "130px" }}
    />
  );
});

// =============================
// DECIMAL INPUT (Jump/Throw)
// =============================
export const DecimalInput = forwardRef(({ athleteId, defaultValue = "", onCommit, onKeyDown, disabled = false }, ref) => {
  const internalRef = useRef(null);
  const inputRef = ref || internalRef;

  const handleInput = () => {
    const input = inputRef.current;
    if (!input) return;

    let val = input.value.toUpperCase();

    // Allow DNF / DIS
    if (val.startsWith("D")) return;

    // Allow digits + dot
    val = val.replace(/[^\d.]/g, "");

    if (val.includes(".")) {
      const [p, d] = val.split(".");
      val = p + "." + (d || "").slice(0, 2);
    }

    input.value = val;
  };

  const handleBlur = () => {
    const input = inputRef.current;
    if (onCommit && input) onCommit(athleteId, input.value);
  };

  const handleKeyDown = (e) => {
    if (onKeyDown) {
      onKeyDown(e, athleteId);
    }
  };

  return (
    <input
      ref={inputRef}
      defaultValue={defaultValue}
      onInput={handleInput}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      inputMode="decimal"
      className="border rounded p-1 text-center disabled:bg-gray-100 disabled:cursor-not-allowed"
      style={{ width: "100px" }}
      placeholder="5.72 / DNF / DIS"
    />
  );
});

// =============================
// INTEGER INPUT (Combined)
// =============================
export const IntegerInput = forwardRef(({ athleteId, defaultValue = "", onCommit, onKeyDown, disabled = false }, ref) => {
  const internalRef = useRef(null);
  const inputRef = ref || internalRef;

  const handleInput = () => {
    const input = inputRef.current;
    if (!input) return;
    input.value = input.value.replace(/\D/g, "");
  };

  const handleBlur = () => {
    const input = inputRef.current;
    if (onCommit && input) onCommit(athleteId, input.value);
  };

  const handleKeyDown = (e) => {
    if (onKeyDown) {
      onKeyDown(e, athleteId);
    }
  };

  return (
    <input
      ref={inputRef}
      defaultValue={defaultValue}
      onInput={handleInput}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      inputMode="numeric"
      className="border rounded p-1 text-center disabled:bg-gray-100 disabled:cursor-not-allowed"
      style={{ width: "100px" }}
      placeholder="5678"
    />
  );
});
