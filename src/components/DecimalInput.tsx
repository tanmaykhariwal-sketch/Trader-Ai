import React, { useEffect, useRef, useState } from 'react';

interface DecimalInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number;
  onChange: (value: number) => void;
}

/**
 * A locale-proof replacement for `<input type="number">` for currency/price
 * fields. Native number inputs render their decimal mark per the OS/browser
 * locale (e.g. a comma instead of a period on some regional Windows setups)
 * even though `value`/`valueAsNumber` are always period-based underneath —
 * so the same ₹1,289.25 shows as "1289,25" in the input while every other
 * label on the page still shows a period. This renders as plain text under
 * our control (always period, matches the rest of the UI) while still
 * bringing up a numeric keypad on mobile via inputMode.
 */
export const DecimalInput: React.FC<DecimalInputProps> = ({ value, onChange, ...rest }) => {
  const [raw, setRaw] = useState(String(value));
  const isFocused = useRef(false);

  // Sync external value changes (e.g. a different signal was selected) into
  // the visible text — but only while the user isn't actively typing here,
  // or every keystroke would get clobbered mid-edit.
  useEffect(() => {
    if (!isFocused.current) setRaw(String(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={raw}
      onFocus={(e) => {
        isFocused.current = true;
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        isFocused.current = false;
        setRaw(String(value));
        rest.onBlur?.(e);
      }}
      onChange={(e) => {
        const next = e.target.value;
        // Only allow digits and a single decimal point while typing, so a
        // stray character can't desync the display from the numeric value.
        if (next === '' || /^\d*\.?\d*$/.test(next)) {
          setRaw(next);
          const parsed = parseFloat(next);
          onChange(isNaN(parsed) ? 0 : parsed);
        }
      }}
      {...rest}
    />
  );
};
