
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth"; 
import { auth } from "@/lib/firebase"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Terminal } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [configError, setConfigError] = useState<ReactNode | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const DetailedError = (
    <>
      <p className="mb-2">This usually happens for one of these reasons:</p>
      <ul className="list-disc space-y-1 pl-5 text-xs">
        <li>The <strong>`NEXT_PUBLIC_FIREBASE_...`</strong> values in your <code>.env.local</code> file are incorrect.</li>
        <li>The <strong>`NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY`</strong> value is missing or incorrect (required for App Check).</li>
        <li>You did not <strong>restart the development server</strong> after editing the <code>.env.local</code> file.</li>
      </ul>
      <p className="mt-3">Please double-check all values, restart your server, and try again.</p>
    </>
  );

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setConfigError(null);

    if (!auth) {
        setConfigError(DetailedError);
        toast({
            title: "Critical Firebase Configuration Error",
            description: "Please see the error message on the page for details.",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }

    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/invalid-credential') {
          description = "Invalid email or password. Please check your credentials and try again.";
      } else if (error.code === 'auth/configuration-not-found') {
          setConfigError(DetailedError);
          description = "Your Firebase configuration is incorrect. See the on-page message for details.";
      } else if (error.code) {
          description = error.message;
      }
      toast({
        title: "Login Failed",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 py-12 px-4 sm:px-6 lg:px-8">
       <Link href="/" className="flex items-center space-x-2 mb-8">
          <ShieldAlert className="h-10 w-10 text-primary" />
          <span className="font-bold text-3xl font-headline">Safety Scan AI</span>
        </Link>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your dashboard and scan history.</CardDescription>
        </CardHeader>
        <CardContent>
          {configError && (
            <Alert variant="destructive" className="mb-6">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Critical Configuration Error</AlertTitle>
              <AlertDescription>
                {configError}
              </AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-between text-sm">
                <Link href="/auth/reset-password" passHref>
                  <Button variant="link" type="button" className="p-0 h-auto font-normal">Forgot password?</Button>
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" passHref>
               <Button variant="link" type="button" className="p-0 h-auto font-normal">Sign up</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
