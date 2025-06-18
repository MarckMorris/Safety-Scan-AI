
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
    initialScanData: Omit<Scan, 'id' | 'userId' | 'targetUrl'> & { createdAt: Timestamp, updatedAt: Timestamp }, // Ensure Timestamp type
    toastFn: ReturnType<typeof useToast>['toast']
) => {
    console.log(`[processScanInBackground] Starting for scan ID: ${scanId}, URL: ${targetUrl}`);
    const scanDocRef = doc(db, "users", userId, "scans", scanId);

    try {
        // 1. Write initial "queued" or "scanning" document to Firestore
        const fullInitialData: Omit<Scan, 'id'> = {
            userId,
            targetUrl,
            status: "scanning", // Let's set it to scanning directly
            createdAt: initialScanData.createdAt,
            updatedAt: initialScanData.updatedAt,
            aiScanResult: null,
            aiSecurityReport: null,
            errorMessage: null,
        };
        await setDoc(scanDocRef, fullInitialData);
        console.log(`[processScanInBackground] Initial scan document CREATED in Firestore for ID: ${scanId}`);

        // 2. Perform the AI scan (currently mocked and fast)
        console.log(`[processScanInBackground] Calling AI scan for URL: ${targetUrl}`);
        const aiScanResult: AIScanResult = await scanUrlForVulnerabilities({ url: targetUrl });
        console.log(`[processScanInBackground] AI scan COMPLETED for ID: ${scanId}`, aiScanResult);

        // 3. Update Firestore document with scan results
        await updateDoc(scanDocRef, {
            status: "completed" as const,
            aiScanResult: aiScanResult,
            updatedAt: serverTimestamp(),
            errorMessage: null,
        });
        console.log(`[processScanInBackground] Firestore document UPDATED to 'completed' for ID: ${scanId}`);
        // Toast for success can be shown on the detail page when data loads, or a global non-blocking toast here.
        // For now, let detail page handle display.

    } catch (error: any) {
        console.error(`[processScanInBackground] Error during processing for scan ID ${scanId}:`, error);
        try {
            await updateDoc(scanDocRef, {
                status: "failed" as const,
                errorMessage: error.message || "Unknown error during scan processing.",
                aiScanResult: null,
                aiSecurityReport: null,
                updatedAt: serverTimestamp(),
            });
            console.log(`[processScanInBackground] Firestore document UPDATED to 'failed' for ID: ${scanId}`);
        } catch (updateError) {
            console.error(`[processScanInBackground] CRITICAL: Failed to update scan doc ${scanId} to 'failed' state after initial error:`, updateError);
        }
        // This toast might be missed if it relies on ScanForm context, but good for logging.
        // It's better to reflect failure status on the detail page.
        toastFn({
            title: "Scan Processing Failed",
            description: `Error processing scan for ${targetUrl}. Check scan details.`,
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
    if (!user || !user.uid) { // Check user and user.uid
      toast({ title: "Authentication Error", description: "User not found. Cannot start scan.", variant: "destructive" });
      console.error("[ScanForm - onSubmit] User or user.uid not found.");
      return;
    }

    setIsSubmitting(true);
    toast({ title: "Scan Queued", description: `Scan for ${data.url} is being initiated... You'll be redirected.` });
    console.log(`[ScanForm - onSubmit] User ID: ${user.uid}, Target URL: ${data.url}`);

    const clientSideScanId = crypto.randomUUID();
    const now = Timestamp.now(); // Use Firestore Timestamp for consistency

    const initialScanDataForBackground = { // Data for the background processing function
        status: "scanning" as const,
        createdAt: now,
        updatedAt: now,
        aiScanResult: null,
        aiSecurityReport: null,
        errorMessage: null,
    };

    // Navigate immediately
    // Pass targetUrl as query param for ScanDetailPage to use if Firestore data is not yet available
    router.push(`/dashboard/scans/${clientSideScanId}?targetUrl=${encodeURIComponent(data.url)}`);
    console.log(`[ScanForm - onSubmit] Navigating to /dashboard/scans/${clientSideScanId}`);
    
    // Call the processing function asynchronously (fire-and-forget from this form's perspective)
    processScanInBackground(user.uid, clientSideScanId, data.url, initialScanDataForBackground, toast)
        .then(() => {
            console.log(`[ScanForm - onSubmit] processScanInBackground for ${clientSideScanId} has been initiated.`);
        })
        .catch((e) => {
            // This catch is for errors in *initiating* processScanInBackground, not errors *within* it.
            console.error(`[ScanForm - onSubmit] Error initiating processScanInBackground for ${clientSideScanId}:`, e);
        });

    form.reset();
    // setIsSubmitting will be reset by component unmount or if navigation fails early.
    // If we stay on the page for some reason, we might want to set it false after a timeout or upon error.
    // For now, optimistic navigation handles this.
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
