
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
// import { sendPasswordResetEmail } from "firebase/auth"; // Firebase import removed
// import { auth } from "@/lib/firebase"; // Firebase import removed
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert } from "lucide-react";
import { useState } from "react";

const resetPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    console.warn("Reset Password onSubmit called with mock auth. Simulating for:", data.email);
    // try {
      // await sendPasswordResetEmail(auth, data.email); // Firebase call removed
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      toast({
        title: "Password Reset Email Sent (Mock)",
        description: "Please check your inbox for instructions to reset your password. (This is a mock response)",
      });
      setEmailSent(true);
    // } catch (error: any) {
    //   console.error("Password reset error (Mock should not throw)", error);
    //   toast({
    //     title: "Password Reset Failed (Mock)",
    //     description: error.message || "An unexpected error occurred. Please try again.",
    //     variant: "destructive",
    //   });
    // } finally {
      setIsLoading(false);
    // }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 py-12 px-4 sm:px-6 lg:px-8">
      <Link href="/" className="flex items-center space-x-2 mb-8">
        <ShieldAlert className="h-10 w-10 text-primary" />
        <span className="font-bold text-3xl font-headline">Safety Scan AI</span>
      </Link>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Reset Your Password</CardTitle>
          <CardDescription>
            {emailSent 
              ? "Check your email for the reset link. (Mock)" 
              : "Enter your email address and we&apos;ll send you a link to reset your password. (Auth is Mocked)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  {isLoading ? "Sending..." : "Send Reset Link (Mock)"}
                </Button>
              </form>
            </Form>
          ) : (
             <div className="text-center">
                <p className="text-green-600">A password reset link has been sent to your email address. (Mock)</p>
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
    </div>
  );
}
