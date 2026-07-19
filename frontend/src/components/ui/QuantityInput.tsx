import React, { useState, useEffect } from 'react';

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

  const stopBubble = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      aria-label="Quantity"
      value={localValue}
      onChange={handleChange}
      onFocus={(e) => {
        setIsFocused(true);
        e.target.select();
      }}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        stopBubble(e);
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={className}
      style={style}
      onClick={stopBubble}
      onMouseDown={stopBubble}
      onPointerDown={stopBubble}
    />
  );
};

export default QuantityInput;
