import React from 'react';

interface MentionsInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const MentionsInput: React.FC<MentionsInputProps> = ({
  value,
  onChange,
  placeholder,
  className,
}) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className || ''}`}
      rows={4}
    />
  );
}; 