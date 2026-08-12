"use client";

import React, { useId } from "react";

export default function DoubleMessageIcon({ size = 25, className = "" }) {
  const reactId = useId();
  const maskId = `double-msg-mask-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="2 2 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <mask id={maskId}>
          <rect x="0" y="0" width="24" height="24" fill="white" />
          {/* Cut out 3 dots inside the bottom-left bubble */}
          <circle cx="7.1" cy="14.2" r="0.85" fill="black" />
          <circle cx="9.5" cy="14.2" r="0.85" fill="black" />
          <circle cx="11.9" cy="14.2" r="0.85" fill="black" />
        </mask>
      </defs>

      {/* Top-Right Bubble (Outlined speech bubble with 3 dots inside) */}
      <g>
        <path
          d="M 14.2 4 C 17.62 4 20.4 6.33 20.4 9.2 C 20.4 11.12 19.34 12.8 17.72 13.72 L 18.5 16.8 L 15.42 14.88 C 15.02 14.96 14.62 15 14.2 15 C 10.78 15 8 12.67 8 9.2 C 8 5.73 10.78 4 14.2 4 Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* 3 dots inside top-right bubble */}
        <circle cx="11.8" cy="9.2" r="0.85" fill="currentColor" />
        <circle cx="14.2" cy="9.2" r="0.85" fill="currentColor" />
        <circle cx="16.6" cy="9.2" r="0.85" fill="currentColor" />
      </g>

      {/* Bottom-Left Bubble (Solid filled speech bubble with 3 cutout dots) */}
      <g>
        <path
          d="M 9.5 9 C 12.92 9 15.7 11.33 15.7 14.2 C 15.7 17.07 12.92 19.4 9.5 19.4 C 9.08 19.4 8.68 19.36 8.28 19.28 L 5.2 21.2 L 5.98 18.12 C 4.36 17.2 3.3 15.52 3.3 14.2 C 3.3 11.33 6.08 9 9.5 9 Z"
          fill="currentColor"
          mask={`url(#${maskId})`}
        />
      </g>
    </svg>
  );
}
