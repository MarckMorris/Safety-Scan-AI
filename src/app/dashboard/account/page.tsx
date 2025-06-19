
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { updateProfile as firebaseUpdateProfile, updateEmail, sendPasswordResetEmail, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"; 
import { doc, updateDoc } from "firebase/firestore"; 
import { auth, db } from "@/lib/firebase"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

const profileSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).max(50),
  email: z.string().email({ message: "Invalid email address." }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function AccountPage() {
  const { user, userProfile, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      email: "",
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        displayName: userProfile.displayName || "",
        email: userProfile.email || "",
      });
    }
  }, [userProfile, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    
    try {
      // Update Firebase Auth profile
      if (data.displayName !== user.displayName) {
        await firebaseUpdateProfile(user, { displayName: data.displayName });
      }
      
      if (data.email !== user.email) {
        // Updating email in Firebase Auth is a sensitive operation and often requires re-authentication.
        // For simplicity, we'll show a toast. A real app might prompt for password.
        // await updateEmail(user, data.email); // This would require re-authentication.
        toast({ 
            title: "Email Update Notice", 
            description: "To change your email address, Firebase requires re-authentication. This feature is simplified in this version. Your email in Auth was not changed.",
            variant: "default" 
        });
      }

      // Update Firestore profile
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { 
        displayName: data.displayName,
        // email: data.email, // Also update email in Firestore if it was successfully changed in Auth
      });

      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
    } catch (error: any) {
      console.error("Profile update error", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update profile. If changing email, re-authentication might be required.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (user && user.email) {
      setIsLoading(true);
      try {
        await sendPasswordResetEmail(auth, user.email);
        toast({
          title: "Password Reset Email Sent",
          description: "Check your email for instructions to reset your password.",
        });
      } catch (error: any) {
        toast({
          title: "Error Sending Reset Email",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || "U";
  }

  if (authLoading) { 
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Account Settings</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={userProfile?.photoURL || undefined} alt={userProfile?.displayName || "User"} />
              <AvatarFallback className="text-3xl">{getInitials(userProfile?.displayName)}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="text-2xl font-headline">Profile Information</CardTitle>
                <CardDescription>Update your display name and email address.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                      <Input type="email" placeholder="you@example.com" {...field} disabled />
                    </FormControl>
                     <FormMessage />
                     <p className="text-xs text-muted-foreground pt-1">Changing email requires re-authentication and is simplified here.</p>
                  </FormItem>
                )}
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <Button type="submit" disabled={isLoading || authLoading} className="flex-1">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={handlePasswordReset} disabled={isLoading || authLoading} className="flex-1">
                  Change Password
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Account Management</CardTitle>
          <CardDescription>Manage your account settings and preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">User Role</h3>
              <p className="text-sm text-muted-foreground capitalize">{userProfile?.role || 'User'}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
            <Button variant="destructive" onClick={logout} disabled={isLoading || authLoading}>
                Log Out
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
