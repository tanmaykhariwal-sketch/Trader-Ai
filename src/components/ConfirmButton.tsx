import React, { useEffect, useRef, useState } from 'react';

interface ConfirmButtonProps {
  onConfirm: () => void;
  className: string;
  armedClassName: string;
  armedLabel: React.ReactNode;
  title?: string;
  children: React.ReactNode;
}

// Two-step confirm: first click arms the button (shows armedLabel), second
// click within the window actually fires onConfirm. Arming auto-resets so a
// stray click days later can't land on an already-armed button.
export const ConfirmButton: React.FC<ConfirmButtonProps> = ({
  onConfirm,
  className,
  armedClassName,
  armedLabel,
  title,
  children
}) => {
  const [armed, setArmed] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const handleClick = () => {
    if (!armed) {
      setArmed(true);
      resetTimer.current = setTimeout(() => setArmed(false), 3000);
      return;
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setArmed(false);
    onConfirm();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onBlur={() => setArmed(false)}
      title={armed ? 'Click again to confirm' : title}
      className={armed ? armedClassName : className}
    >
      {armed ? armedLabel : children}
    </button>
  );
};
