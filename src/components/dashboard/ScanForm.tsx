
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
    toast: ReturnType<typeof useToast>['toast']
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
        // Toasting here might be missed if user has navigated away or if it's too quick
        // The scan detail page should reflect the final status
    } catch (error: any) {
        console.error(`[ScanForm - performScanAndUpdateDb] Error during AI scan or Firestore update for doc ID: ${scanDocId}`, error);
        
        // Update Firestore document with failure status
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
        // Toasting here might also be missed.
        toast({ // Use the passed toast instance
            title: "Scan Processing Failed",
            description: `An error occurred while processing the scan for ${url}. Check scan details.`,
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
    toast({ title: "Scan Queued", description: `Scan for ${data.url} is being initiated. Redirecting...` });
    console.log(`[ScanForm - onSubmit] User ID: ${user.uid}, Target URL: ${data.url}`);

    let scanDocId: string | null = null;
    try {
      // 1. Create initial "scanning" scan document in Firestore
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

      // 2. IMPORTANT: Do NOT await the long-running task here.
      // Call the helper function to perform the scan and update in the "background".
      performScanAndUpdateDb(user.uid, scanDocId, data.url, toast);
      console.log(`[ScanForm - onSubmit] performScanAndUpdateDb called for doc ID: ${scanDocId}. It will run asynchronously.`);

      // 3. Redirect immediately to the scan detail page
      router.push(`/dashboard/scans/${scanDocId}`);
      console.log(`[ScanForm - onSubmit] Redirecting to /dashboard/scans/${scanDocId}`);
      form.reset(); 

    } catch (error: any) {
      console.error("[ScanForm - onSubmit] Error during initial Firestore doc creation or redirection:", error);
      toast({
        title: "Scan Initiation Failed",
        description: error.message || "Could not initiate the scan. Please try again.",
        variant: "destructive",
      });
      // If doc creation failed, scanDocId might be null.
      // If it succeeded but redirection failed, the async task might still run.
      // This part of error handling is tricky as the async task is detached.
    } finally {
      // Only set isSubmitting to false if we didn't redirect or if an error occurred before redirection intent
      // If redirection is successful, the component unmounts, so this state change might not matter.
      // However, if initial addDoc fails, we need to re-enable the button.
      if (!scanDocId) { // Indicates initial addDoc likely failed
          setIsSubmitting(false);
          console.log("[ScanForm - onSubmit] Resetting isSubmitting to false due to error before/during doc creation.");
      }
    }
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

