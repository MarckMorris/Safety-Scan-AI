
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; 
import { auth, db } from "@/lib/firebase"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/types"; 
import { ShieldAlert, AlertTriangle, Loader2 } from "lucide-react"; 
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 

const registerSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!auth || !db) throw new Error("Firebase is not initialized. Please check your configuration.");
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: data.displayName }); 
      
      const userProfileData: UserProfile = { 
        uid: user.uid,
        email: user.email,
        displayName: data.displayName,
        role: 'user', 
      };
      await setDoc(doc(db, "users", user.uid), userProfileData);

      toast({
        title: "Registration Successful",
        description: "Welcome to Safety Scan AI!",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Registration error", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/configuration-not-found') {
          description = "Configuration Error: The app cannot connect to Firebase. Double-check that your .env.local file has the correct Firebase keys and that you have restarted the development server.";
      } else if (error.code === 'auth/email-already-in-use') {
          description = "This email address is already in use. Please try another one or log in.";
      } else if (error.message) {
          description = error.message;
      }
      setError(description);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 py-12 px-4 sm:px-6 lg:px-8">
      <Link href="/" className="flex items-center space-x-2 mb-8">
        <ShieldAlert className="h-10 w-10 text-primary" />
        <span className="font-bold text-3xl font-headline">Safety Scan AI</span>
      </Link>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
          <CardDescription>Join Safety Scan AI to start securing your applications.</CardDescription>
        </CardHeader>
        <CardContent>
            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Registration Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                        <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
            </form>
            </Form>
            <div className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link href="/auth/login" passHref>
                <Button variant="link" type="button" className="p-0 h-auto font-normal">Sign in</Button>
            </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
