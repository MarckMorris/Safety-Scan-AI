
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { scanUrlForVulnerabilities } from "@/ai/flows/scan-url-for-vulnerabilities";
import type { AIScanResult, Scan } from "@/types"; // Keep Scan type
import { useAuth } from "@/context/AuthContext";
import { addDoc, collection, serverTimestamp, doc, updateDoc } from "firebase/firestore"; // Added doc and updateDoc
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
  const { user } = useAuth(); // User will be the mock user from AuthContext
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
      toast({ title: "Authentication Error (Mock)", description: "Mock user not found. This shouldn't occur in test mode.", variant: "destructive" });
      return;
    }

    let scanDocId: string | null = null; 
    setIsScanning(true);
    toast({ title: "Scan Initiated", description: `Scanning ${data.url}... This may take some time.` });

    try {
      // 1. Create initial "scanning" scan document in Firestore
      const initialScanData = {
        userId: user.uid,
        targetUrl: data.url,
        status: "scanning" as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        aiScanResult: null,
        aiSecurityReport: null,
        errorMessage: null,
      };
      
      const scanDocRef = await addDoc(collection(db, "users", user.uid, "scans"), initialScanData);
      scanDocId = scanDocRef.id;

      // 2. Call the AI flow (client-side, will block)
      const aiScanResult: AIScanResult = await scanUrlForVulnerabilities({ url: data.url });

      // 3. Update Firestore document with results
      const scanDocToUpdate = doc(db, "users", user.uid, "scans", scanDocId);
      await updateDoc(scanDocToUpdate, {
        status: "completed" as const,
        aiScanResult: aiScanResult,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Scan Complete",
        description: `Successfully scanned ${data.url}. View results now.`,
      });
      router.push(`/dashboard/scans/${scanDocId}`);
      form.reset(); // Reset form after successful navigation

    } catch (error: any) {
      console.error("Scan process error:", error);
      toast({
        title: "Scan Failed",
        description: error.message || "An unexpected error occurred during the scan process.",
        variant: "destructive",
      });

      if (scanDocId && user) {
        try {
          const scanDocToUpdate = doc(db, "users", user.uid, "scans", scanDocId);
          await updateDoc(scanDocToUpdate, {
            status: "failed" as const,
            errorMessage: error.message || "Unknown error during scan.",
            updatedAt: serverTimestamp(),
          });
          // Redirect to the scan detail page even on failure, so the user can see the failed status
          router.push(`/dashboard/scans/${scanDocId}`);
          form.reset(); // Reset form after navigation
        } catch (updateError: any) {
          console.error("Error updating scan to failed status:", updateError);
          // If updating fails, at least reset the form and scanning state
        }
      }
    } finally {
      setIsScanning(false);
      // form.reset(); // Moved reset into success/error blocks if navigation occurs
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
