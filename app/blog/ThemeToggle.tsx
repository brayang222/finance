"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => {
    setLight(document.documentElement.getAttribute("data-theme") === "light");
  }, []);
  const toggle = () => {
    const val = light ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", val);
    document.cookie = `gfp-theme=${val}; path=/; max-age=31536000; SameSite=Lax`;
    setLight(!light);
  };
  return (
    <button
      onClick={toggle}
      aria-label="Cambiar tema"
      className="cursor-pointer bg-transparent border-none p-1 flex items-center"
      style={{ color: "var(--muted)" }}
    >
      {light ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z" />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
        </svg>
      )}
    </button>
  );
}
