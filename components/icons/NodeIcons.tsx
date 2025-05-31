
import React from 'react';

export const TriggerIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.362-6.867 8.209 8.209 0 013 2.48Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18Z" />
  </svg>
);

export const LLMIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5M19.5 8.25H21M19.5 12H21M19.5 15.75H21M12 12l-.5.5m0 0l-.5-.5m.5.5l.5.5m-.5-.5l.5-.5M12 6.75v.008v.008v.008v.008v.008M12 17.25v-.008v-.008v-.008v-.008v-.008" />
  </svg>
);

export const ToolIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.528-1.036.94-2.196 1.026-3.417l.004-.006c.018-.22.008-.444-.038-.664a1.001 1.001 0 00-1.022-.87l-.005.004c-.218.01-.437.008-.657-.038C11.956 5.663 10.796 5.25 9.76 4.722L3.03 11.45M11.42 15.17L3 21m8.42-5.83l2.496-3.03M14.25 3l6 6" />
  </svg>
);

export const ConditionIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 0l-3.536-3.536M14.828 9.172L11.292 12.708l-3.535-3.536m7.071 7.071l-3.536-3.535m0 0l-3.536 3.535m7.071-7.071l3.536 3.535M4.929 9.172L1.393 5.636m0 0L4.93 2.1M1.393 5.636L4.93 9.172m13.433 7.071l3.536-3.536m0 0l-3.536-3.535m3.536 3.535l-3.536 3.536m-7.07 0l3.535-3.535" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25l2.25 2.25L12 12.75 M12 8.25L9.75 10.5 12 12.75" />
  </svg>
);

export const EndIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
  </svg>
);

export const CogIcon: React.FC<{className?: string}> = ({ className }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15 0H3m18 0h-1.5m-15 0H3m18 0h-1.5M12 4.5v15m0-15a7.5 7.5 0 00-7.5 7.5m7.5-7.5a7.5 7.5 0 017.5 7.5M12 4.5v15m0-15V3m0 18v-1.5m0-15V3m0 18v-1.5m-7.5-1.5h15M4.5 12h15M4.5 12H3m18 0h-1.5" />
</svg>
);
    