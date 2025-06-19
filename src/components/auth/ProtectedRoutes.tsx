
"use client";

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton'; // Re-enabled

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps): JSX.Element | null => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    // router.push('/auth/login'); // This is handled by useEffect
    return null; // Return null while redirecting
  }

  return <>{children}</>;
};

export default ProtectedRoute;
