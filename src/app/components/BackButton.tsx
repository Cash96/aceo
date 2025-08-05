'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export function BackButton({ label = 'Back' }: { label?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(true); // initially visible

  // Hide button after a short delay
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2000); // hide after 2s
    return () => clearTimeout(timer);
  }, [pathname]);

  // Show button on hover near top of page
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 40) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Hide button if at home page
  if (!pathname || pathname === '/') {
    return null;
  }

  const handleBack = () => {
    const segments = pathname.split('/').filter(Boolean);
    segments.pop();
    const newPath = '/' + segments.join('/');
    router.push(newPath || '/');
  };

  return (
    <button
      onClick={handleBack}
      className={`fixed top-4 left-4 z-50 px-4 py-2 bg-white hover:bg-gray-100 
                 rounded-md text-gray-800 text-sm font-medium border border-gray-300 shadow-sm
                 transition-all duration-300
                 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
    >
      ← {label}
    </button>
  );
}
