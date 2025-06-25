
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth"; 
import { auth, isFirebaseInitialized } from "@/lib/firebase"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ShieldAlert, AlertTriangle, Loader2 } from "lucide-react"; 
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 
import { useToast } from "@/hooks/use-toast";

const resetPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ConfigErrorCard() {
    return (
        <Card className="w-full max-w-md shadow-2xl border-destructive">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-headline text-destructive">Configuration Error</CardTitle>
                <CardDescription>The application cannot connect to the backend.</CardDescription>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Action Required</AlertTitle>
                    <AlertDescription>
                        Please check your `.env.local` file for correct Firebase keys and ensure you have **restarted the development server** after making changes.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfigError, setShowConfigError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!isFirebaseInitialized) {
        setShowConfigError(true);
    }
  }, []);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    setError(null);
    setEmailSent(false);

    try {
      if (!auth) {
        setShowConfigError(true);
        throw new Error("Firebase is not initialized.");
      }
      await sendPasswordResetEmail(auth, data.email);
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your inbox for instructions to reset your password.",
      });
      setEmailSent(true);
    } catch (error: any) {
      console.error("Password reset error", error);
      if (error.code === 'auth/configuration-not-found') {
        setShowConfigError(true);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
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
      
      {!isClient ? (
            <Card className="w-full max-w-md shadow-2xl flex items-center justify-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </Card>
      ) : showConfigError ? (
        <ConfigErrorCard />
      ) : (
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Reset Your Password</CardTitle>
            <CardDescription>
              {emailSent 
                ? "Check your email for the reset link." 
                : "Enter your email address and we&apos;ll send you a link to reset your password."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Request Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {!emailSent ? (
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
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending...</> : "Send Reset Link"}
                  </Button>
                </form>
              </Form>
            ) : (
               <div className="text-center">
                  <p className="text-green-600">A password reset link has been sent to your email address.</p>
               </div>
            )}
            <div className="mt-6 text-center text-sm">
              Remember your password?{" "}
              <Link href="/auth/login" passHref>
                 <Button variant="link" type="button" className="p-0 h-auto font-normal">Sign in</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
