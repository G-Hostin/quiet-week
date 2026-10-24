// Small stroke icons (one weight, 1.8px, round caps), drawn to match the type.
type P = { size?: number; className?: string };

function Svg({ size = 16, className, children }: P & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const Check = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 8.5l3 3 6-7" />
  </Svg>
);

export const ChevronRight = (p: P) => (
  <Svg {...p}>
    <path d="M6 3.5L10.5 8 6 12.5" />
  </Svg>
);

export const ChevronLeft = (p: P) => (
  <Svg {...p}>
    <path d="M10 3.5L5.5 8 10 12.5" />
  </Svg>
);

export const ChevronDown = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 6L8 10.5 12.5 6" />
  </Svg>
);

export const ArrowLeft = (p: P) => (
  <Svg {...p}>
    <path d="M13 8H3.5M7.5 4L3.5 8l4 4" />
  </Svg>
);

export const ArrowRight = (p: P) => (
  <Svg {...p}>
    <path d="M3 8h9.5M8.5 4l4 4-4 4" />
  </Svg>
);

/** A pointer over a bar: "click a week". */
export const Tap = (p: P) => (
  <Svg {...p}>
    <path d="M6.5 8.5V3.2a1.2 1.2 0 012.4 0v4.3l3 .6a1.5 1.5 0 011.2 1.7l-.6 3.6a1.5 1.5 0 01-1.5 1.3H8a1.6 1.6 0 01-1.3-.6L4 11a1.2 1.2 0 011.7-1.7z" />
  </Svg>
);

export const External = (p: P) => (
  <Svg {...p}>
    <path d="M9.5 3H13v3.5M13 3L7.5 8.5M11 9.5V12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1h2.5" />
  </Svg>
);

export const Info = (p: P) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 7.2V11M8 5h0" />
  </Svg>
);
