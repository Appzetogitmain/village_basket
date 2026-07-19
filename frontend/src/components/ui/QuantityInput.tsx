import React, { useState, useEffect, useRef } from 'react';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Called when the typed value was above max and got clamped */
  onClampMax?: (max: number, attempted: number) => void;
}

const isCoarsePointer = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    (navigator?.maxTouchPoints ?? 0) > 0);

const QuantityInput: React.FC<QuantityInputProps> = ({
  value,
  onChange,
  min = 0,
  max = 999,
  className = '',
  style = {},
  onClampMax,
}) => {
  const [localValue, setLocalValue] = useState<string>(value.toString());
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value.toString());
    }
  }, [value, isFocused]);

  const commitValue = (raw: string) => {
    const parsed = parseInt(raw, 10);
    let next = parsed;
    let clampedMax = false;

    if (isNaN(parsed) || parsed < min) {
      next = min;
    } else if (max !== undefined && parsed > max) {
      next = max;
      clampedMax = true;
    }

    setLocalValue(next.toString());

    if (clampedMax && onClampMax) {
      onClampMax(max, parsed);
    }

    // Only notify parent when value actually changes (avoid no-op API calls)
    if (next !== value) {
      onChange(next);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;

    // Update local display while typing; save on blur/Enter
    if (newVal === '') {
      setLocalValue('');
      return;
    }

    if (!/^\d*$/.test(newVal)) return;
    setLocalValue(newVal);
  };

  const handleBlur = () => {
    setIsFocused(false);
    commitValue(localValue);
  };

  // Only stop click bubble (card navigation). Do NOT stop pointerdown/mousedown —
  // that blocks focus/caret in Flutter WebView and many mobile browsers.
  const stopClickBubble = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <input
      ref={inputRef}
      // tel opens a reliable numeric keypad in Android/iOS WebViews
      type="tel"
      inputMode="numeric"
      pattern="[0-9]*"
      enterKeyHint="done"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      aria-label="Quantity"
      value={localValue}
      onChange={handleChange}
      onFocus={(e) => {
        setIsFocused(true);
        // select-all often breaks editing inside Flutter WebView / mobile WebKit
        if (!isCoarsePointer()) {
          e.target.select();
        }
      }}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
      onClick={stopClickBubble}
      onTouchEnd={(e) => {
        // Help stubborn WebViews take focus on the qty field
        stopClickBubble(e);
        const el = inputRef.current;
        if (el && document.activeElement !== el) {
          el.focus();
        }
      }}
      className={className}
      style={{
        // >=16px prevents iOS zoom that can steal focus in WebViews
        fontSize: style.fontSize || '16px',
        touchAction: 'manipulation',
        WebkitUserSelect: 'text',
        userSelect: 'text',
        WebkitTouchCallout: 'default',
        ...style,
      }}
    />
  );
};

export default QuantityInput;
