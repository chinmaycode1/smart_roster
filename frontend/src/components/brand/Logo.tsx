export function Logo({ size = 32 }: { size?: number }) {
  const scale = size / 32;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="28" height="28" rx="6" fill="#2F6DB5" />
      <circle cx="10" cy="10" r={2 * scale} fill="white" />
      <circle cx="16" cy="10" r={2 * scale} fill="white" />
      <circle cx="22" cy="10" r={2 * scale} fill="white" />
      <circle cx="10" cy="16" r={2 * scale} fill="white" />
      <circle cx="16" cy="16" r={2 * scale} fill="white" opacity="0.5" />
      <circle cx="22" cy="16" r={2 * scale} fill="white" />
      <circle cx="10" cy="22" r={2 * scale} fill="white" />
      <circle cx="16" cy="22" r={2 * scale} fill="white" />
      <circle cx="22" cy="22" r={2 * scale} fill="white" />
      <path
        d="M26 20L28 22L26 24"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
