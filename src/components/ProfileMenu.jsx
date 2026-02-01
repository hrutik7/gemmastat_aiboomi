import React, { useEffect, useRef, useState } from 'react';
import ThemeToggle from './ThemeToggle.jsx';

function ProfileMenu({ onLogout, onTakeTour, isAdmin, onAdmin }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState('down'); // 'down' or 'up'
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // compute whether to open up or down
  const computePosition = () => {
    const btn = buttonRef.current;
    if (!btn) return setPosition('down');
    const rect = btn.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const isDesktop = window.innerWidth >= 1024; // treat large screens as desktop

    if (isDesktop) {
      // prefer opening up on desktop (per request)
      setPosition('up');
      return;
    }

    // otherwise choose based on available space
    // assume menu height ~ 260px as a heuristic; prefer up if there's more space above
    const MENU_HEURISTIC = 260;
    if (spaceBelow < MENU_HEURISTIC && spaceAbove >= MENU_HEURISTIC) setPosition('up');
    else setPosition('down');
  };

  // recompute on open and on resize
  useEffect(() => {
    if (open) computePosition();
  }, [open]);

  useEffect(() => {
    const onResize = () => {
      if (open) computePosition();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open]);

  const toggleMenu = () => {
    if (!open) {
      computePosition();
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  return (
    <div className="relative h-10 w-full z-40" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="flex w-full py-2 justify-between items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white grid place-items-center text-xs">👤</span>
        <span className="text-sm font-medium">Profile</span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute right-0 w-56 rounded-xl border border-gray-200 bg-white shadow-lg dark:bg-gray-800 dark:border-gray-700 overflow-hidden z-50
            ${position === 'down' ? 'mt-2 top-full' : 'mb-2 bottom-full'}`}
        >
          <div className="p-2">
            <div className="px-2 py-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Theme</div>
            <div className="px-2 pb-2">
              <ThemeToggle />
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700" />
          <button
            onClick={() => { setOpen(false); onTakeTour && onTakeTour(); }}
            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-100"
          >
            🎯 Take Tour
          </button>
          {isAdmin && (
            <button
              onClick={() => { setOpen(false); onAdmin && onAdmin(); }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-100"
            >
              🔧 Admin Panel
            </button>
          )}
          <button
            onClick={() => { setOpen(false); onLogout && onLogout(); }}
            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
          >
            ⎋ Log Out
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;


