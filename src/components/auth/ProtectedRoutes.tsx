
"use client";

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps): JSX.Element | null => {
  const { user, loading, authError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && !authError) {
      router.push('/auth/login');
    }
  }, [user, loading, router, authError]);

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="max-w-md p-8 bg-card border rounded-lg shadow-lg">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-destructive">Database Setup Required</h1>
            <p className="mt-2 text-muted-foreground">{authError}</p>
            <div className="mt-4 text-sm text-left text-card-foreground space-y-2">
                <p>To fix this, you need to create a Firestore database in your Firebase project:</p>
                <ol className="list-decimal list-inside space-y-1 bg-secondary/50 p-3 rounded-md">
                    <li>Click the button below to go to the Firestore Console.</li>
                    <li>Click <strong>"Create database"</strong>.</li>
                    <li>Start in <strong>Production mode</strong>.</li>
                    <li>Choose a location for your database and click "Enable".</li>
                </ol>
                <p className="pt-2 text-muted-foreground">
                  After creating the database, you will need to deploy the security rules I provided earlier.
                  You can find instructions in your `README.md` file.
                </p>
            </div>
            {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && (
               <Button asChild className="mt-6 w-full">
                  <a 
                    href={`https://console.firebase.google.com/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/firestore`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                      Go to Firestore Console & Create Database
                  </a>
              </Button>
            )}
        </div>
      </div>
    );
  }

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
    return null; // Return null while redirecting
  }

  return <>{children}</>;
};

export default ProtectedRoute;
