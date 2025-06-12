
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
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Loader2 } from "lucide-react";

const scanFormSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL (e.g., https://example.com)." }),
});

type ScanFormValues = z.infer<typeof scanFormSchema>;

export default function ScanForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);

  const form = useForm<ScanFormValues>({
    resolver: zodResolver(scanFormSchema),
    defaultValues: {
      url: "",
    },
  });

  const onSubmit = async (data: ScanFormValues) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to start a scan.", variant: "destructive" });
      return;
    }

    setIsScanning(true);
    toast({ title: "Scan Initiated", description: `Scanning ${data.url}... This may take a few moments.` });

    try {
      // 1. Create initial scan document in Firestore
      const scanDocRef = await addDoc(collection(db, "users", user.uid, "scans"), {
        userId: user.uid,
        targetUrl: data.url,
        status: "scanning",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // For immediate UI update, redirect or navigate to a pending scan page
      // router.push(`/dashboard/scans/${scanDocRef.id}`); // Optional: redirect immediately

      // 2. Call the AI flow
      // In a real app, this would be a backend task. For demo, client-side.
      const aiScanResult: AIScanResult = await scanUrlForVulnerabilities({ url: data.url });

      // 3. Update Firestore document with results
      const updatedScanData: Partial<Scan> = {
        status: "completed", // Or 'generating_report' if another step follows
        aiScanResult: aiScanResult,
        updatedAt: serverTimestamp(),
      };
      // For simplicity, we directly update here. In a real app, this update might come from a backend function.
      // This is a simplified example; a full implementation might use Firebase Functions to update the doc
      // after the AI flow completes to avoid client holding onto the process.
      // For now, let's assume we update it client-side for this scaffold.
      // This assumes scanDocRef.id is available from addDoc.
      // await updateDoc(doc(db, "users", user.uid, "scans", scanDocRef.id), updatedScanData);
      // However, to keep it simple, we'll store the full initial scan object with results directly.
      // This is not ideal for long-running tasks.
      const fullScanData: Omit<Scan, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any} = {
        userId: user.uid,
        targetUrl: data.url,
        status: "completed",
        aiScanResult: aiScanResult,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      // Overwrite the initial placeholder document or create a new one if not redirected.
      // For this example, let's just create a new one with full data if not redirecting.
      // Or, ideally, the initial document should just be created, then the user redirected.
      // The scan detail page would then poll for updates or listen to Firestore changes.
      
      // Let's go with creating a new doc with result and redirecting.
      // This is simpler for scaffolding. A proper backend process is better.
      const finalScanDocRef = await addDoc(collection(db, "users", user.uid, "scans"), fullScanData);

      toast({
        title: "Scan Complete",
        description: `Successfully scanned ${data.url}. View results now.`,
      });
      router.push(`/dashboard/scans/${finalScanDocRef.id}`);

    } catch (error: any) {
      console.error("Scan error:", error);
      toast({
        title: "Scan Failed",
        description: error.message || "An unexpected error occurred during the scan.",
        variant: "destructive",
      });
       // Update scan status to failed in Firestore if scanDocRef exists
    } finally {
      setIsScanning(false);
      form.reset();
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
                    <Input id="url" placeholder="https://example.com or https://api.example.com" {...field} className="text-base py-6" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full text-base py-6" disabled={isScanning}>
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Scanning...
                </>
              ) : (
                "Start Scan"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
