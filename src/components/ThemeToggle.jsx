import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = ({ className = '' }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => (
    typeof window !== 'undefined' && localStorage.getItem('meo-vang-nha-theme') === 'dark'
  ));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('meo-vang-nha-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <button
      type="button"
      className={`yarn-theme-toggle ${isDarkMode ? 'is-dark' : 'is-light'} ${className}`}
      onClick={() => setIsDarkMode(current => !current)}
      aria-label={isDarkMode ? 'Bật đèn, chuyển sang giao diện sáng' : 'Tắt đèn, chuyển sang giao diện tối'}
      title={isDarkMode ? 'Bật đèn' : 'Tắt đèn'}
    >
      <span className="yarn-theme-toggle__track" aria-hidden="true">
        <span className="yarn-theme-toggle__thread" />
        <span className="yarn-theme-toggle__ball"><span /></span>
      </span>
      {isDarkMode ? <Moon className="yarn-theme-toggle__icon" /> : <Sun className="yarn-theme-toggle__icon" />}
    </button>
  );
};

export default ThemeToggle;