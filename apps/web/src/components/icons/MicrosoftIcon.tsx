import React from "react";

export function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      role="img"
      aria-label="Microsoft"
    >
      <rect x="1.5" y="1.5" width="10" height="10" rx="1.2" fill="#F35325" />
      <rect x="12.5" y="1.5" width="10" height="10" rx="1.2" fill="#81BC06" />
      <rect x="1.5" y="12.5" width="10" height="10" rx="1.2" fill="#FFBA08" />
      <rect x="12.5" y="12.5" width="10" height="10" rx="1.2" fill="#05A6F0" />
    </svg>
  );
}

export default MicrosoftIcon;
