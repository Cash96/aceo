'use client';

import { usePathname } from 'next/navigation';
import { BackButton } from './BackButton';

export function BackButtonWrapper() {
  const pathname = usePathname();
  const hideBackButton = pathname.startsWith('/chat/');

  if (hideBackButton) return null;
  return <BackButton label="Go Back" />;
}
