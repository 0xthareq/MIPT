const P = {
  home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 5.2a3.2 3.2 0 010 5.6" /><path d="M18 14.4c1.8.8 3 2.8 3 5.6" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  heart: <path d="M12 20s-7-4.4-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.6-9 9-9 9z" />,
  pie: <><path d="M12 3v9h9" /><path d="M20.5 15A9 9 0 1112 3" /></>,
  stetho: <><path d="M6 3v6a4 4 0 008 0V3" /><path d="M10 13v2a5 5 0 0010 0v-1" /><circle cx="20" cy="12" r="2" /></>,
  note: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5" /><path d="M9 13h7M9 17h7" /></>,
  refresh: <><path d="M20 11a8 8 0 10-2.3 6" /><path d="M20 4v7h-7" /></>,
  logout: <><path d="M10 4H5v16h5" /><path d="M15 8l4 4-4 4" /><path d="M19 12H9" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
};

export default function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ico">
      {P[name]}
    </svg>
  );
}
