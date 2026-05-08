export function FragmentMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="frag-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFD2E7" />
          <stop offset="0.5" stopColor="#C8B6FF" />
          <stop offset="1" stopColor="#DCEEFF" />
        </linearGradient>
        <linearGradient id="frag-shine" x1="6" y1="6" x2="22" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#frag-grad)" />
      <circle cx="16" cy="16" r="14" stroke="#39234D" strokeOpacity="0.12" />
      <ellipse cx="13" cy="12" rx="6" ry="4" fill="url(#frag-shine)" />
    </svg>
  )
}
