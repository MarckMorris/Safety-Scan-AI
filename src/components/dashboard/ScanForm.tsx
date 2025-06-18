
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { scanUrlForVulnerabilities } from "@/ai/flows/scan-url-for-vulnerabilities";
import type { AIScanResult, Scan } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { doc, setDoc, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Loader2 } from "lucide-react";

const scanFormSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL (e.g., https://example.com)." }),
});

type ScanFormValues = z.infer<typeof scanFormSchema>;

// Asynchronous helper function to perform Firestore operations and AI scan
const processScanInBackground = async (
    userId: string,
    scanId: string,
    targetUrl: string,
    initialScanDataBase: Omit<Scan, 'id' | 'userId' | 'targetUrl' | 'status' | 'aiScanResult' | 'aiSecurityReport' | 'errorMessage'>,
    toastFn: ReturnType<typeof useToast>['toast']
) => {
    console.log(`[processScanInBackground] Initiated for scan ID: ${scanId}, User: ${userId}, URL: ${targetUrl}`);
    const scanDocRef = doc(db, "users", userId, "scans", scanId);

    try {
        // 1. Write initial "scanning" document to Firestore
        const initialFullScanData: Omit<Scan, 'id'> = {
            userId,
            targetUrl,
            status: "scanning",
            createdAt: initialScanDataBase.createdAt,
            updatedAt: initialScanDataBase.updatedAt,
            aiScanResult: null,
            aiSecurityReport: null,
            errorMessage: null,
        };
        console.log(`[processScanInBackground] Attempting to set initial document for scan ID: ${scanId}`, initialFullScanData);
        await setDoc(scanDocRef, initialFullScanData);
        console.log(`[processScanInBackground] Initial scan document CREATED in Firestore for ID: ${scanId}`);

        // 2. Perform the AI scan (currently mocked and fast)
        console.log(`[processScanInBackground] Calling AI scan (scanUrlForVulnerabilities) for URL: ${targetUrl}`);
        const aiScanResult: AIScanResult = await scanUrlForVulnerabilities({ url: targetUrl });
        console.log(`[processScanInBackground] AI scan COMPLETED for ID: ${scanId}. Result:`, aiScanResult);

        // 3. Update Firestore document with scan results
        const updateData = {
            status: "completed" as const,
            aiScanResult: aiScanResult,
            updatedAt: serverTimestamp(),
            errorMessage: null,
        };
        console.log(`[processScanInBackground] Attempting to update Firestore document to 'completed' for ID: ${scanId} with data:`, updateData);
        await updateDoc(scanDocRef, updateData);
        console.log(`[processScanInBackground] Firestore document UPDATED to 'completed' for ID: ${scanId}`);
        // Toast for success is best handled by the detail page observing the change.
        // toastFn({ title: "Scan Complete", description: `Scan for ${targetUrl} finished successfully.` });


    } catch (error: any) {
        console.error(`[processScanInBackground] CRITICAL ERROR during processing for scan ID ${scanId}:`, error);
        try {
            const errorUpdateData = {
                status: "failed" as const,
                errorMessage: error.message || "Unknown error during scan processing.",
                aiScanResult: null, // Ensure these are cleared on failure
                aiSecurityReport: null,
                updatedAt: serverTimestamp(),
            };
            console.log(`[processScanInBackground] Attempting to update Firestore document to 'failed' for ID: ${scanId} due to error. Update data:`, errorUpdateData);
            await updateDoc(scanDocRef, errorUpdateData);
            console.log(`[processScanInBackground] Firestore document UPDATED to 'failed' for ID: ${scanId}`);
        } catch (updateError) {
            console.error(`[processScanInBackground] CRITICAL: Failed to update scan doc ${scanId} to 'failed' state after initial error:`, updateError);
        }
        // This toast might be missed if it relies on ScanForm context, but good for logging.
        // It's better to reflect failure status on the detail page.
        toastFn({
            title: "Scan Processing Failed",
            description: `Error processing scan for ${targetUrl}. Details: ${error.message || 'Unknown error'}. Check scan details page.`,
            variant: "destructive",
        });
    }
};


export default function ScanForm() {
  const { toast } = useToast();
  const { user } = useAuth(); // Mocked user is available here
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
    if (!user || !user.uid) { 
      toast({ title: "Authentication Error", description: "User not found. Cannot start scan.", variant: "destructive" });
      console.error("[ScanForm - onSubmit] User or user.uid not found.");
      setIsSubmitting(false); // Reset submitting state
      return;
    }

    setIsSubmitting(true);
    // Toast that it's queued, navigation will show progress
    toast({ title: "Scan Initiated", description: `Scan for ${data.url} is being initiated. You'll be redirected.` });
    console.log(`[ScanForm - onSubmit] User ID: ${user.uid}, Target URL: ${data.url}`);

    const clientSideScanId = crypto.randomUUID();
    console.log(`[ScanForm - onSubmit] Generated client-side scan ID: ${clientSideScanId}`);
    const now = Timestamp.now(); 

    // Data for the background processing function, only contains immutable parts for initial record
    const initialScanDataBaseForBackground = { 
        createdAt: now,
        updatedAt: now, // This will be overwritten by serverTimestamp on updates
    };

    // Navigate immediately. Pass targetUrl as query param for ScanDetailPage to use if Firestore data is not yet available
    // and scanId as well for immediate use.
    router.push(`/dashboard/scans/${clientSideScanId}?targetUrl=${encodeURIComponent(data.url)}`);
    console.log(`[ScanForm - onSubmit] Navigated to /dashboard/scans/${clientSideScanId}`);
    
    // Call the processing function asynchronously (fire-and-forget from this form's perspective)
    processScanInBackground(user.uid, clientSideScanId, data.url, initialScanDataBaseForBackground, toast)
        .then(() => {
            console.log(`[ScanForm - onSubmit] processScanInBackground for ${clientSideScanId} has completed its asynchronous execution path (doesn't mean success/failure of scan, just that the async function itself finished).`);
        })
        .catch((e) => {
            // This catch is for errors in *initiating* processScanInBackground, not errors *within* it.
            console.error(`[ScanForm - onSubmit] CRITICAL Error trying to start processScanInBackground for ${clientSideScanId}:`, e);
            // Potentially show a more critical error toast here if even launching the background task fails
            toast({
                title: "Scan Initiation Failed Critically",
                description: `Could not even start the scan process for ${data.url}. Please try again.`,
                variant: "destructive",
            });
        });

    form.reset();
    // setIsSubmitting will be reset by component unmount after navigation.
    // If navigation somehow fails or is very slow, and the component remains mounted,
    // this could lead to the button remaining in a disabled state.
    // However, the router.push should be quite fast.
    // To be absolutely safe, one could add:
    // setTimeout(() => setIsSubmitting(false), 2000); // Reset after a delay if still on page
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
