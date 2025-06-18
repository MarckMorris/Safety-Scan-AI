
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { scanUrlForVulnerabilities } from "@/ai/flows/scan-url-for-vulnerabilities";
import type { AIScanResult } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { addDoc, collection, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Loader2 } from "lucide-react";

const scanFormSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL (e.g., https://example.com)." }),
});

type ScanFormValues = z.infer<typeof scanFormSchema>;

// Helper function to perform the actual scan and update Firestore
// This function will be called without awaiting it in the main onSubmit flow
const performScanAndUpdateDb = async (
    userId: string,
    scanDocId: string,
    url: string,
    toastFn: ReturnType<typeof useToast>['toast'] // Pass toast function explicitly
) => {
    console.log(`[ScanForm - performScanAndUpdateDb] Starting AI scan for doc ID: ${scanDocId}, URL: ${url}`);
    try {
        const aiScanResult: AIScanResult = await scanUrlForVulnerabilities({ url });
        console.log(`[ScanForm - performScanAndUpdateDb] AI scan completed for doc ID: ${scanDocId}`, aiScanResult);

        const scanDocToUpdate = doc(db, "users", userId, "scans", scanDocId);
        await updateDoc(scanDocToUpdate, {
            status: "completed" as const,
            aiScanResult: aiScanResult,
            updatedAt: serverTimestamp(),
            errorMessage: null,
        });
        console.log(`[ScanForm - performScanAndUpdateDb] Firestore updated to completed for doc ID: ${scanDocId}`);
        // Consider a toast on the scan detail page after data loads, rather than here.
    } catch (error: any) {
        console.error(`[ScanForm - performScanAndUpdateDb] Error during AI scan or Firestore update for doc ID: ${scanDocId}`, error);
        
        const scanDocToUpdate = doc(db, "users", userId, "scans", scanDocId);
        try {
            await updateDoc(scanDocToUpdate, {
                status: "failed" as const,
                errorMessage: error.message || "Unknown error during scan processing.",
                aiScanResult: null,
                aiSecurityReport: null,
                updatedAt: serverTimestamp(),
            });
            console.log(`[ScanForm - performScanAndUpdateDb] Firestore updated to failed for doc ID: ${scanDocId}`);
        } catch (updateError) {
            console.error(`[ScanForm - performScanAndUpdateDb] CRITICAL: Failed to update scan doc ${scanDocId} to failed state after error:`, updateError);
        }
        // This toast might be missed if navigation is too fast or user context changes.
        // It's better to show errors on the scan detail page.
        toastFn({ 
            title: "Scan Processing Failed",
            description: `Error processing scan for ${url}. Details on scan page.`,
            variant: "destructive",
        });
    }
};


export default function ScanForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ScanFormValues>({
    resolver: zodResolver(scanFormSchema),
    defaultValues: {
      url: "",
    },
  });

  const onSubmit = async (data: ScanFormValues) => {
    console.log("[ScanForm - onSubmit] Form submitted with data:", data);
    if (!user) {
      toast({ title: "Authentication Error (Mock)", description: "Mock user not found. Cannot start scan.", variant: "destructive" });
      console.error("[ScanForm - onSubmit] Mock user not found.");
      return;
    }

    setIsSubmitting(true);
    // Toast that it's queued, UI will show spinning
    toast({ title: "Scan Queued", description: `Scan for ${data.url} is being initiated...` });
    console.log(`[ScanForm - onSubmit] User ID: ${user.uid}, Target URL: ${data.url}`);

    let scanDocId: string | null = null;
    try {
      const initialScanData = {
        userId: user.uid,
        targetUrl: data.url,
        status: "scanning" as const, // Start as 'scanning' or 'queued'
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        aiScanResult: null,
        aiSecurityReport: null,
        errorMessage: null,
      };
      
      console.log("[ScanForm - onSubmit] Creating initial scan document in Firestore with data:", initialScanData);
      const scanDocRef = await addDoc(collection(db, "users", user.uid, "scans"), initialScanData);
      scanDocId = scanDocRef.id;
      console.log(`[ScanForm - onSubmit] Initial scan document created with ID: ${scanDocId}`);

      // Call the helper function to perform the scan and update in the "background".
      // Pass the toast function from useToast() hook.
      performScanAndUpdateDb(user.uid, scanDocId, data.url, toast);
      console.log(`[ScanForm - onSubmit] performScanAndUpdateDb called for doc ID: ${scanDocId}. It will run asynchronously.`);

      // Redirect immediately to the scan detail page
      router.push(`/dashboard/scans/${scanDocId}`);
      console.log(`[ScanForm - onSubmit] Redirecting to /dashboard/scans/${scanDocId}`);
      form.reset();
      //setIsSubmitting(false); // This will be unmounted, so not strictly necessary.

    } catch (error: any) {
      console.error("[ScanForm - onSubmit] Error during initial Firestore doc creation or redirection:", error);
      toast({
        title: "Scan Initiation Failed",
        description: error.message || "Could not initiate the scan. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false); // Re-enable form if initial doc creation failed
      console.log("[ScanForm - onSubmit] Resetting isSubmitting to false due to error before/during doc creation.");
    }
    // No finally setIsSubmitting(false) here because if successful, component unmounts.
    // If addDoc fails, the catch block handles setIsSubmitting.
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">New Security Scan</CardTitle>
        <CardDescription>Enter a URL to scan for vulnerabilities using our AI-powered engine.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="url" className="text-base">Target URL</FormLabel>
                  <FormControl>
                    <Input id="url" placeholder="https://example.com or https://api.example.com" {...field} className="text-base py-6" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full text-base py-6" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Initiating Scan...
                </>
              ) : (
                "Start Scan"
              )}
            </Button>
            {isSubmitting && <p className="text-xs text-muted-foreground text-center mt-2">Please wait, your scan is being prepared. You will be redirected shortly.</p>}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
