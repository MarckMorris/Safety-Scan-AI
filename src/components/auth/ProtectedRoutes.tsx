
"use client";

import { ReactNode } from 'react';
// import { useRouter } from 'next/navigation'; // Not needed if always rendering children
// import { useAuth } from '@/context/AuthContext'; // Not needed if always rendering children
// import { Skeleton } from '@/components/ui/skeleton'; // Not needed

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps): JSX.Element => {
  // const { user, loading } = useAuth(); // Mocked: user is always present, loading is false
  // const router = useRouter();

  // useEffect(() => {
  //   // Original logic:
  //   // if (!loading && !user) {
  //   //   router.push('/auth/login');
  //   // }
  // }, [user, loading, router]);

  // if (loading) {
  //   return (
  //     <div className="flex flex-col items-center justify-center min-h-screen p-4">
  //       <div className="w-full max-w-md space-y-4">
  //         <Skeleton className="h-12 w-full" />
  //         <Skeleton className="h-8 w-3/4" />
  //         <Skeleton className="h-32 w-full" />
  //         <Skeleton className="h-10 w-full" />
  //       </div>
  //     </div>
  //   );
  // }

  // if (!user && !loading) { // This condition might be met after mock logout
  //   // To truly "takeout authentication" for testing other features,
  //   // we should not block access here.
  //   // router.push('/auth/login'); // Avoid redirecting
  //   // return null; 
  // }

  // For "takeout authentication" mode, always render children to allow testing of dashboard pages.
  return <>{children}</>;
};

export default ProtectedRoute;
