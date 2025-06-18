
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
    toastFn: ReturnType<typeof useToast>['toast'] // Keep toastFn if needed for direct errors here, though detail page handles most.
) => {
    console.log(`[processScanInBackground] Initiated for scan ID: ${scanId}, User: ${userId}, URL: ${targetUrl}`);
    const scanDocRef = doc(db, "users", userId, "scans", scanId);

    try {
        // 1. Write initial "scanning" document to Firestore
        const initialFullScanData: Omit<Scan, 'id'> = {
            userId,
            targetUrl,
            status: "scanning", // Start as "scanning"
            createdAt: initialScanDataBase.createdAt,
            updatedAt: initialScanDataBase.updatedAt,
            aiScanResult: null,
            aiSecurityReport: null,
            errorMessage: null,
        };
        console.log(`[processScanInBackground] Attempting to set initial document for scan ID: ${scanId}`, initialFullScanData);
        await setDoc(scanDocRef, initialFullScanData);
        console.log(`[processScanInBackground] Initial scan document CREATED in Firestore for ID: ${scanId} with status 'scanning'.`);

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
        // Success toast is better handled by the detail page observing the change.

    } catch (error: any) {
        console.error(`[processScanInBackground] CRITICAL ERROR during processing for scan ID ${scanId}:`, error);
        if (error instanceof Error) {
            console.error(`[processScanInBackground] Error Name: ${error.name}`);
            console.error(`[processScanInBackground] Error Message: ${error.message}`);
            console.error(`[processScanInBackground] Error Stack: ${error.stack}`);
        } else {
            console.error(`[processScanInBackground] Non-Error object thrown:`, JSON.stringify(error, null, 2));
        }
        
        try {
            const errorUpdateData = {
                status: "failed" as const,
                errorMessage: error.message || "Unknown error during scan processing.",
                aiScanResult: null,
                aiSecurityReport: null,
                updatedAt: serverTimestamp(),
            };
            console.log(`[processScanInBackground] Attempting to update Firestore document to 'failed' for ID: ${scanId} due to error. Update data:`, errorUpdateData);
            // Use updateDoc, assuming the doc might have been created before the error.
            // If setDoc failed, this updateDoc will also fail if the doc doesn't exist,
            // but it's a good attempt to mark it as failed.
            await updateDoc(scanDocRef, errorUpdateData).catch(async (updateErr) => {
                 // If update failed because doc doesn't exist (e.g. setDoc failed), try setDoc for error state
                console.warn(`[processScanInBackground] updateDoc for failed status failed (likely no initial doc), trying setDoc for scan ID ${scanId}`, updateErr);
                await setDoc(scanDocRef, {
                     userId,
                     targetUrl,
                     status: "failed" as const,
                     createdAt: initialScanDataBase.createdAt, // Or Timestamp.now() if original is unavailable
                     updatedAt: serverTimestamp(),
                     aiScanResult: null,
                     aiSecurityReport: null,
                     errorMessage: error.message || "Unknown error during scan processing.",
                });
            });
            console.log(`[processScanInBackground] Firestore document status updated/set to 'failed' for ID: ${scanId}`);
        } catch (updateError: any) {
            console.error(`[processScanInBackground] CRITICAL: Failed to update/set scan doc ${scanId} to 'failed' state after initial error:`, updateError);
            if (updateError instanceof Error) {
                console.error(`[processScanInBackground] Update/Set Error Name: ${updateError.name}`);
                console.error(`[processScanInBackground] Update/Set Error Message: ${updateError.message}`);
            }
        }
        // Failure toast is better handled by detail page observing the 'failed' status.
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
    if (!user || !user.uid) { 
      toast({ title: "Authentication Error", description: "User not found. Cannot start scan.", variant: "destructive" });
      console.error("[ScanForm - onSubmit] User or user.uid not found.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    toast({ title: "Scan Initiated", description: `Scan for ${data.url} is being initiated. You'll be redirected.` });
    console.log(`[ScanForm - onSubmit] User ID: ${user.uid}, Target URL: ${data.url}`);

    const clientSideScanId = crypto.randomUUID();
    console.log(`[ScanForm - onSubmit] Generated client-side scan ID: ${clientSideScanId}`);
    const now = Timestamp.now(); 

    const initialScanDataBaseForBackground = { 
        createdAt: now,
        updatedAt: now,
    };
    
    // Navigate immediately. Pass targetUrl and scanId as query params.
    router.push(`/dashboard/scans/${clientSideScanId}?targetUrl=${encodeURIComponent(data.url)}`);
    console.log(`[ScanForm - onSubmit] Navigated to /dashboard/scans/${clientSideScanId}`);
    
    // Call the processing function asynchronously
    processScanInBackground(user.uid, clientSideScanId, data.url, initialScanDataBaseForBackground, toast)
        .then(() => {
            console.log(`[ScanForm - onSubmit] processScanInBackground for ${clientSideScanId} promise resolved (doesn't indicate success/failure of scan itself).`);
        })
        .catch((e) => {
            console.error(`[ScanForm - onSubmit] CRITICAL Error starting processScanInBackground for ${clientSideScanId}:`, e);
            toast({
                title: "Scan Initiation Failed Critically",
                description: `Could not start the scan process for ${data.url}. Please try again.`,
                variant: "destructive",
            });
        });

    form.reset();
    // setIsSubmitting will be reset effectively by unmounting or can be reset after a short delay
    // For now, relying on navigation to unmount/remount if needed.
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
