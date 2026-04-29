'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clearAuthSession, fetchCurrentUser, getAuthToken } from '@/shared/lib/auth-api';

interface AuthGateProps {
  children: React.ReactNode;
}

const PUBLIC_PATHS = ['/login'];

export function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  const isPublicPage = useMemo(() => {
    return PUBLIC_PATHS.some((path) => pathname?.startsWith(path));
  }, [pathname]);

  useEffect(() => {
    let active = true;

    if (isPublicPage) {
      setChecking(false);
      return () => {
        active = false;
      };
    }

    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      setChecking(false);
      return () => {
        active = false;
      };
    }

    const verify = async () => {
      try {
        await fetchCurrentUser();
        if (!active) return;
      } catch {
        clearAuthSession();
        if (!active) return;
        router.replace('/login');
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    };

    void verify();

    return () => {
      active = false;
    };
  }, [isPublicPage, router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-xl bg-white px-6 py-4 text-sm text-slate-600 shadow">正在验证登录状态...</div>
      </div>
    );
  }

  return <>{children}</>;
}
