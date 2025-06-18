
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
import { doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
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
    initialTimestamps: { createdAt: Timestamp, updatedAt: Timestamp }
) => {
    console.log(`[processScanInBackground] Initiated for scan ID: ${scanId}, User: ${userId}, URL: ${targetUrl}`);
    const scanDocRef = doc(db, "users", userId, "scans", scanId);
    let finalScanData: Omit<Scan, 'id'>;

    try {
        console.log(`[processScanInBackground] Calling AI scan (scanUrlForVulnerabilities) for URL: ${targetUrl}`);
        const aiScanResult: AIScanResult = await scanUrlForVulnerabilities({ url: targetUrl });
        console.log(`[processScanInBackground] AI scan COMPLETED for ID: ${scanId}. Result:`, aiScanResult);

        finalScanData = {
            userId,
            targetUrl,
            status: "completed",
            aiScanResult: aiScanResult,
            aiSecurityReport: null, // Report generated separately
            createdAt: initialTimestamps.createdAt,
            updatedAt: serverTimestamp(), // Will be set by Firestore
            errorMessage: null,
        };
        console.log(`[processScanInBackground] Attempting to set 'completed' document for scan ID: ${scanId}`, finalScanData);
        await setDoc(scanDocRef, finalScanData);
        console.log(`[processScanInBackground] Firestore document CREATED/SET to 'completed' for ID: ${scanId}`);

    } catch (error: any) {
        console.error(`[processScanInBackground] CRITICAL ERROR during processing for scan ID ${scanId}:`, error);
        let errorMessage = "Unknown error during scan processing.";
        if (error instanceof Error) {
            errorMessage = error.message;
            console.error(`[processScanInBackground] Error Name: ${error.name}, Message: ${errorMessage}, Stack: ${error.stack}`);
        } else {
            try {
                errorMessage = JSON.stringify(error);
            } catch (e) {
                // Non-serializable error
            }
            console.error(`[processScanInBackground] Non-Error object thrown:`, errorMessage);
        }
        
        finalScanData = {
            userId,
            targetUrl,
            status: "failed",
            aiScanResult: null,
            aiSecurityReport: null,
            createdAt: initialTimestamps.createdAt,
            updatedAt: serverTimestamp(), // Will be set by Firestore
            errorMessage: errorMessage,
        };
        console.log(`[processScanInBackground] Attempting to set 'failed' document for scan ID: ${scanId} due to error. Data:`, finalScanData);
        try {
            await setDoc(scanDocRef, finalScanData);
            console.log(`[processScanInBackground] Firestore document CREATED/SET to 'failed' for ID: ${scanId}`);
        } catch (setDocError: any) {
            console.error(`[processScanInBackground] CRITICAL: Failed to set scan doc ${scanId} to 'failed' state after initial error:`, setDocError);
        }
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
    
    const clientSideScanId = crypto.randomUUID();
    console.log(`[ScanForm - onSubmit] Generated client-side scan ID: ${clientSideScanId}`);
    const now = Timestamp.now(); 

    const initialTimestamps = { 
        createdAt: now,
        updatedAt: now, // This will be server-updated later but good for initial object consistency
    };
    
    // Pass targetUrl and scanId as query params.
    // The detail page will show "queued" or "loading" based on this initial info.
    router.push(`/dashboard/scans/${clientSideScanId}?targetUrl=${encodeURIComponent(data.url)}`);
    console.log(`[ScanForm - onSubmit] Navigated to /dashboard/scans/${clientSideScanId}`);
    
    // Toast after navigation attempt
    toast({ title: "Scan Queued", description: `Scan for ${data.url} has been queued. You've been redirected to the results page.` });
    
    processScanInBackground(user.uid, clientSideScanId, data.url, initialTimestamps)
        .then(() => {
            console.log(`[ScanForm - onSubmit] processScanInBackground for ${clientSideScanId} promise resolved (doesn't indicate success/failure of scan itself).`);
        })
        .catch((e) => {
            console.error(`[ScanForm - onSubmit] CRITICAL Error from processScanInBackground promise for ${clientSideScanId}:`, e);
            // This toast might not be seen if navigation has already occurred and this component unmounted.
            // Errors are better handled by updating the Firestore doc to 'failed', which the detail page will pick up.
        });

    form.reset();
    // setIsSubmitting will be reset effectively by unmounting due to navigation or could be set false after a small delay.
    // If navigation doesn't unmount, and you want to allow another submission soon:
    // setTimeout(() => setIsSubmitting(false), 500); // Or rely on unmount
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
