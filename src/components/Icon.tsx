// Тонкие line-иконки в едином стиле (stroke 1.5, round caps)
type IconProps = {
  name: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
};

const paths: Record<string, React.ReactNode> = {
  logo: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </>
  ),
  habit: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v4.5l3 2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 5 6v5.5c0 4.3 3 7.5 7 9 4-1.5 7-4.7 7-9V6l-7-2.5Z" />
      <path d="m9.2 12 2 2 3.6-4" />
    </>
  ),
  check: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <path d="m8.5 12.2 2.4 2.4 4.8-5" />
    </>
  ),
  wallet: (
    <>
      <rect x="3.5" y="6" width="17" height="13" rx="3" />
      <path d="M3.5 10h17" />
      <circle cx="16.5" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  heart: (
    <path d="M12 19.5s-6.5-4-6.5-8.6C5.5 8.2 7.5 6.5 9.7 6.5c1.2 0 2 .5 2.3 1.1.3-.6 1.1-1.1 2.3-1.1 2.2 0 4.2 1.7 4.2 4.4 0 4.6-6.5 8.6-6.5 8.6Z" />
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <path d="M7 16v-5" />
      <path d="M12 16V7" />
      <path d="M17 16v-8" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2M6.7 6.7l1.4 1.4M15.9 15.9l1.4 1.4M17.3 6.7l-1.4 1.4M8.1 15.9l-1.4 1.4" />
    </>
  ),
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  trash: (
    <>
      <path d="M4.5 7h15" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M6.5 7 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
    </>
  ),
  play: <path d="M9 6.8v10.4l8-5.2-8-5.2Z" />,
  pause: <path d="M9.5 6.5v11M14.5 6.5v11" />,
  reset: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.5 4.5V9H9" />
    </>
  ),
  fire: (
    <path d="M12 4c.5 2.5-1.5 3.5-2.5 5.5-.8 1.6-.5 3.5 1 4.5-.2-1.6.4-2.7 1.5-3.5-.2 2.5 3 2.5 3 5 0-1 .3-2 1-2.8.9 1.2 1.5 2.4 1.5 3.8a5.5 5.5 0 0 1-11 0C6.5 12 10.5 10 12 4Z" />
  ),
  run: (
    <>
      <circle cx="14" cy="5.5" r="1.8" />
      <path d="M13.5 9.5 10 11l1 3.5-3 5" />
      <path d="m13.5 9.5 3 2 2.5-1" />
      <path d="m11 14.5 3.5 1.5.5 4.5" />
    </>
  ),
  book: (
    <>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15.5H7.5A2.5 2.5 0 0 0 5 21V5.5Z" />
      <path d="M5 18.5A2.5 2.5 0 0 1 7.5 16H19" />
    </>
  ),
  spark: (
    <path d="M12 4.5 13.6 10 19 12l-5.4 2-1.6 5.5L10.4 14 5 12l5.4-2L12 4.5Z" />
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.2-3.8-8.5S9.5 5.8 12 3.5Z" />
    </>
  ),
  smoke: (
    <>
      <rect x="3.5" y="13.5" width="13" height="4" rx="1.5" />
      <path d="M19.5 13.5v4" />
      <path d="M7 10c0-1.4 1.2-1.6 1.2-3M11 10c0-1.4 1.2-1.6 1.2-3" />
    </>
  ),
  phone: (
    <>
      <rect x="7.5" y="3.5" width="9" height="17" rx="2.5" />
      <path d="M11 18h2" />
    </>
  ),
  burger: (
    <>
      <path d="M4.5 8.5h15M4.5 12.5h15M4.5 16.5h15" />
      <path d="M6.5 5.5h11" />
    </>
  ),
  moon: <path d="M19 14.5A8 8 0 0 1 9.5 5a8 8 0 1 0 9.5 9.5Z" />,
  drop: <path d="M12 4.5S6.5 10.6 6.5 14.2a5.5 5.5 0 0 0 11 0C17.5 10.6 12 4.5 12 4.5Z" />,
  arrowUp: <path d="M12 18V6m0 0-5 5m5-5 5 5" />,
  arrowDown: <path d="M12 6v12m0 0 5-5m-5 5-5-5" />,
  close: <path d="m6.5 6.5 11 11m0-11-11 11" />,
  menu: <path d="M4.5 7.5h15M4.5 12h15M4.5 16.5h15" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="3" />
      <path d="M4 10.5h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
};

export default function Icon({ name, className = "", size = 20, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {paths[name] ?? paths.spark}
    </svg>
  );
}
