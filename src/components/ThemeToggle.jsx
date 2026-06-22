import { useState } from 'react';
import { getTheme, setTheme } from '../data/store';

export default function ThemeToggle() {
  const [theme, setLocal] = useState(getTheme());

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setLocal(next);
  }

  return (
    <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
