
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
// import { updateProfile as firebaseUpdateProfile, updateEmail, sendPasswordResetEmail } from "firebase/auth"; // Firebase import removed
// import { doc, updateDoc } from "firebase/firestore"; // Firebase import removed
// import { auth, db } from "@/lib/firebase"; // Firebase import removed
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
      toast({ title: "Error (Mock)", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    console.warn("Account onSubmit called with mock auth. Simulating profile update for:", data.displayName);
    // try {
      // Update Firebase Auth profile
      // if (data.displayName !== user.displayName) {
        // await firebaseUpdateProfile(user, { displayName: data.displayName }); // Firebase call removed
      // }
      // if (data.email !== user.email) {
         // await updateEmail(user, data.email); // Firebase call removed
        //  toast({ title: "Email Update (Mock)", description: "Email update requires re-authentication, which is not fully implemented in this demo.", variant: "default" });
      // }

      // Update Firestore profile
      // const userDocRef = doc(db, "users", user.uid); // Firestore call removed
      // await updateDoc(userDocRef, { // Firestore call removed
      //   displayName: data.displayName,
      // });
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

      toast({
        title: "Profile Updated (Mock)",
        description: "Your profile information has been successfully updated. (This is a mock response)",
      });
    // } catch (error: any) {
    //   console.error("Profile update error (Mock should not throw)", error);
    //   toast({
    //     title: "Update Failed (Mock)",
    //     description: error.message || "Could not update profile.",
    //     variant: "destructive",
    //   });
    // } finally {
      setIsLoading(false);
    // }
  };

  const handlePasswordReset = async () => {
    if (user && user.email) {
      setIsLoading(true);
      console.warn("Account handlePasswordReset called with mock auth for:", user.email);
      // try {
        // await sendPasswordResetEmail(auth, user.email); // Firebase call removed
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        toast({
          title: "Password Reset Email Sent (Mock)",
          description: "Check your email for instructions to reset your password. (This is a mock response)",
        });
      // } catch (error: any) {
      //   toast({
      //     title: "Error Sending Reset Email (Mock)",
      //     description: error.message,
      //     variant: "destructive",
      //   });
      // } finally {
        setIsLoading(false);
      // }
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "MU"; // Mock User
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || "MU";
  }

  if (authLoading) { // Should be false with mocked AuthContext
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
                <CardDescription>Update your display name and email address. (Auth is Mocked)</CardDescription>
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
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                     <p className="text-xs text-muted-foreground pt-1">Changing email is mocked.</p>
                  </FormItem>
                )}
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <Button type="submit" disabled={isLoading || authLoading} className="flex-1">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes (Mock)"}
                </Button>
                <Button type="button" variant="outline" onClick={handlePasswordReset} disabled={isLoading || authLoading} className="flex-1">
                  Change Password (Mock)
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
                Log Out (Mock)
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
