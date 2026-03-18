import React, { useState, useEffect } from 'react';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
  style?: React.CSSProperties;
}

const QuantityInput: React.FC<QuantityInputProps> = ({
  value,
  onChange,
  min = 0,
  max = 999,
  className = '',
  style = {},
}) => {
  const [localValue, setLocalValue] = useState<string>(value.toString());

  // Keep local value in sync with external changes, but not while user is typing
  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    
    // Allow empty string temporarily, plus sanitize numeric input
    if (newVal === '') {
      setLocalValue('');
      return;
    }

    // Only allow digits
    if (!/^\d*$/.test(newVal)) return;

    setLocalValue(newVal);

    const parsed = parseInt(newVal, 10);
    if (!isNaN(parsed) && parsed >= min) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(localValue, 10);
    if (isNaN(parsed) || parsed < min) {
      setLocalValue(min.toString());
      onChange(min);
    } else if (max && parsed > max) {
      setLocalValue(max.toString());
      onChange(max);
    } else {
      setLocalValue(parsed.toString()); // Re-format to remove leading zeros
      onChange(parsed);
    }
  };

  return (
    <input
      type="text" // Using text to have full control over backspace and character entry
      inputMode="numeric"
      pattern="[0-9]*"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      style={style}
      // Stop propagation to avoid card clicks if embedded in a card
      onClick={(e) => e.stopPropagation()}
    />
  );
};

export default QuantityInput;
