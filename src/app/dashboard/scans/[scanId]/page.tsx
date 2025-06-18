
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp, onSnapshot } from "firebase/firestore"; // Added onSnapshot
import { db } from "@/lib/firebase";
import type { Scan, AISecurityReport, Vulnerability, AIPatchSuggestion } from "@/types";
import VulnerabilityItem from "@/components/dashboard/VulnerabilityItem";
import ReportDisplay from "@/components/dashboard/ReportDisplay";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, AlertTriangle, Clock, Loader2, RefreshCw, FileText, Download, Wand2, Code, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // Ensure these are imported
import { useToast } from "@/hooks/use-toast";
import { generateSecurityImprovementReport } from "@/ai/flows/generate-security-improvement-report";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
// Import mockScansData for fallback if needed, and also to provide structure if Firestore fails completely.
import { mockScansData } from "@/app/dashboard/scans/page";


const getStatusBadgeVariant = (status: Scan["status"]): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "completed": return "default";
    case "failed": return "destructive";
    case "scanning": case "generating_report": case "queued": return "secondary";
    default: return "outline";
  }
};

const getStatusIcon = (status: Scan["status"]) => {
  switch (status) {
    case "completed": return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "failed": return <AlertTriangle className="w-5 h-5 text-destructive" />;
    case "scanning": case "generating_report": return <Loader2 className="w-5 h-5 animate-spin text-primary" />; // Use primary for scanning
    case "queued": return <Clock className="w-5 h-5 text-muted-foreground" />;
    default: return <Clock className="w-5 h-5 text-muted-foreground" />;
  }
};


export default function ScanDetailPage() {
  const params = useParams();
  const scanId = params.scanId as string;
  const { user } = useAuth(); // Mocked user
  const router = useRouter();
  const { toast } = useToast();

  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [patchSuggestions, setPatchSuggestions] = useState<AIPatchSuggestion[]>([]);
  const [isLoadingPatches, setIsLoadingPatches] = useState(false);

  useEffect(() => {
    if (!user || !scanId) {
        setLoading(false); // Stop loading if no user or scanId
        // Try to load mock scan if ID matches and user is somehow null (though mock user is always set)
        const mockScan = mockScansData.find(s => s.id === scanId);
        if (mockScan) {
            setScan(mockScan);
            toast({ title: "Displaying Mock Scan", description: "User or Scan ID missing, showing mock data.", variant: "default" });
        } else {
            toast({ title: "Error", description: "User or Scan ID missing. Cannot load scan.", variant: "destructive" });
            router.push("/dashboard/scans");
        }
        return;
    }

    setLoading(true);
    const scanDocRef = doc(db, "users", user.uid, "scans", scanId);

    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(scanDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const scanData = { id: docSnap.id, ...docSnap.data() } as Scan;
        setScan(scanData);
        if (scanData.status === "failed" && scanData.errorMessage) {
            toast({ title: `Scan Failed: ${scanData.targetUrl}`, description: scanData.errorMessage, variant: "destructive" });
        } else if (scanData.status === "completed" && !scanData.aiScanResult) {
            // This case might indicate an issue if it completes without results
            console.warn("Scan completed but no AI scan results found for scan ID:", scanId);
        }
      } else {
        toast({ title: "Scan Not Found", description: "The scan may have been deleted or does not exist. Trying mock data.", variant: "destructive" });
        const mockScan = mockScansData.find(s => s.id === scanId);
        if (mockScan) {
            setScan(mockScan);
            toast({ title: "Displaying Mock Scan", description: "Real scan not found, showing mock data.", variant: "default" });
        } else {
            router.push("/dashboard/scans");
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching scan details with onSnapshot:", error);
      toast({ title: "Error Fetching Scan", description: "Could not fetch scan details in real-time. Trying mock data.", variant: "destructive" });
      const mockScan = mockScansData.find(s => s.id === scanId);
        if (mockScan) {
            setScan(mockScan);
        } else {
             // router.push("/dashboard/scans"); // Avoid redirecting if mock also fails
             console.error("Mock scan also not found for ID:", scanId);
        }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [user, scanId, router, toast]);


  const handleGenerateReport = async () => {
    if (!scan || !scan.aiScanResult || !user || scan.id.startsWith("mock-")) {
      toast({ title: "Cannot Generate Report", description: "Scan data incomplete, user not found, or this is a mock scan.", variant: "destructive" });
      return;
    }

    setIsGeneratingReport(true);
    const scanDocRef = doc(db, "users", user.uid, "scans", scanId);
    
    try {
      // Optimistically update local state and Firestore
      setScan(prev => prev ? {...prev, status: "generating_report"} : null);
      await updateDoc(scanDocRef, { status: "generating_report", updatedAt: serverTimestamp() });

      const aiReport: AISecurityReport = await generateSecurityImprovementReport({
        scanResults: JSON.stringify(scan.aiScanResult),
      });

      // Update local state and Firestore with the generated report
      setScan(prev => prev ? {...prev, aiSecurityReport: aiReport, status: "completed", updatedAt: Timestamp.now()} : null);
      await updateDoc(scanDocRef, {
        aiSecurityReport: aiReport,
        status: "completed",
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Report Generated", description: "Security improvement report successfully generated." });

    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({ title: "Report Generation Failed", description: error.message || "Could not generate report.", variant: "destructive" });
      // Revert status if generation failed
      setScan(prev => prev ? {...prev, status: "completed"} : null); // Or original status if known
      await updateDoc(scanDocRef, { status: "completed", updatedAt: serverTimestamp() });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleGeneratePatchSuggestions = async () => {
    if (!scan || !scan.aiScanResult?.vulnerabilities || scan.aiScanResult.vulnerabilities.length === 0) {
        toast({ title: "No Vulnerabilities", description: "No vulnerabilities to generate patches for.", variant: "default" });
        return;
    }
    setIsLoadingPatches(true);
    // Placeholder: In a real app, call a Genkit flow here
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    const mockSuggestions: AIPatchSuggestion[] = scan.aiScanResult.vulnerabilities.map(v => ({
        vulnerabilityType: v.type,
        vulnerabilityDescription: v.description, // Added this field to type
        affectedComponent: v.affectedUrl || v.affectedFile || "Unknown component",
        suggestedCodePatch: `// Mock fix for ${v.type}\nconsole.log("Secure this: ${v.description.substring(0,30)}...");`,
        explanation: `This is a mock patch explanation for ${v.type} at ${v.affectedUrl || v.affectedFile || 'N/A'}. Severity: ${v.severity}. Ensure all inputs are validated and outputs encoded.`,
        language: 'javascript' // Assuming JS for mock
    }));
    setPatchSuggestions(mockSuggestions);
    setIsLoadingPatches(false);
    toast({ title: "Patch Suggestions Generated (Mock)", description: "Displaying mock patch suggestions." });
  };

  const handleDownloadPatches = (format: "json" | "text") => {
    if (patchSuggestions.length === 0) {
        toast({title: "No Patches", description: "No patch suggestions to download.", variant: "default"});
        return;
    }
    const dataStr = format === "json"
        ? JSON.stringify(patchSuggestions, null, 2)
        : patchSuggestions.map(p => `Vulnerability: ${p.vulnerabilityType}\nAffected: ${p.affectedComponent}\nSuggestion:\n${p.suggestedCodePatch}\nExplanation:\n${p.explanation}\n\n---\n\n`).join('');
    
    const dataUri = `data:text/${format};charset=utf-8,${encodeURIComponent(dataStr)}`;
    const downloadLink = document.createElement('a');
    downloadLink.setAttribute('href', dataUri);
    downloadLink.setAttribute('download', `patch_suggestions_${scanId}.${format}`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast({title: "Patches Downloaded", description: `Patch suggestions downloaded as ${format}.`});
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Scans
        </Button>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading scan details for {scanId}...</p>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Scan Not Found</h2>
        <p className="text-muted-foreground mb-6">The scan (ID: {scanId}) could not be loaded or does not exist.</p>
        <Button onClick={() => router.push('/dashboard/scans')}>Go to Scan History</Button>
      </div>
    );
  }

  const vulnerabilities = scan.aiScanResult?.vulnerabilities || [];

  return (
    <div className="space-y-8">
      <div>
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Scans
        </Button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 mb-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline truncate" title={scan.targetUrl}>{scan.targetUrl}</h1>
                <p className="text-sm text-muted-foreground">
                    Scanned on: {scan.createdAt ? format(scan.createdAt.toDate(), "MMM dd, yyyy 'at' hh:mm a") : 'N/A'}
                    {scan.updatedAt && scan.createdAt.seconds !== scan.updatedAt.seconds && (
                       ` (Updated: ${format(scan.updatedAt.toDate(), "hh:mm a")})`
                    )}
                </p>
            </div>
            <Badge variant={getStatusBadgeVariant(scan.status)} className="text-base px-4 py-2 capitalize flex items-center gap-2">
                {getStatusIcon(scan.status)}
                {scan.status.replace('_', ' ')}
            </Badge>
        </div>
      </div>
      
      {scan.status === "failed" && (
        <Card className="border-destructive bg-destructive/10">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle/>Scan Failed</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive-foreground">{scan.errorMessage || "An unknown error occurred during the scan."}</p>
            </CardContent>
        </Card>
      )}

      {(scan.status === "scanning" || scan.status === "queued") && !scan.aiScanResult && (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center">
                    <Loader2 className="w-6 h-6 mr-2 text-primary animate-spin" /> Scan in Progress...
                </CardTitle>
                <CardDescription>The scan for {scan.targetUrl} is currently {scan.status.replace('_',' ')}. Results will appear here once completed.</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium">Please wait...</p>
                <p className="text-muted-foreground">You can navigate away; the scan will continue in the background.</p>
            </CardContent>
        </Card>
      )}

      {scan.aiScanResult && (scan.status === "completed" || scan.status === "generating_report") && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center">
                <FileText className="w-6 h-6 mr-2 text-primary" /> Scan Summary & Vulnerabilities
            </CardTitle>
            <CardDescription>{scan.aiScanResult.summary}</CardDescription>
          </CardHeader>
          <CardContent>
            {vulnerabilities.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {vulnerabilities.map((vuln, index) => (
                  <VulnerabilityItem key={index} vulnerability={vuln} index={index}/>
                ))}
              </Accordion>
            ) : scan.status === 'completed' ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium">No vulnerabilities found!</p>
                <p className="text-muted-foreground">This scan did not detect any vulnerabilities.</p>
              </div>
            ) : null }
          </CardContent>
        </Card>
      )}

      {scan.status === 'completed' && vulnerabilities.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
                <CardTitle className="text-xl font-headline flex items-center">
                    <Wand2 className="w-6 h-6 mr-2 text-primary" /> AI Patch Suggestions
                </CardTitle>
                <CardDescription>Get AI-powered code suggestions to fix identified vulnerabilities.</CardDescription>
            </div>
            {!patchSuggestions.length && (
                <Button onClick={handleGeneratePatchSuggestions} disabled={isLoadingPatches}>
                {isLoadingPatches ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Generate Patches (Mock)
                </Button>
            )}
          </CardHeader>
          {patchSuggestions.length > 0 && (
            <CardContent>
              <Accordion type="multiple" className="w-full space-y-2">
                {patchSuggestions.map((patch, index) => (
                  <AccordionItem value={`patch-${index}`} key={index} className="bg-muted/50 rounded-md">
                    <AccordionTrigger className="px-4 text-left hover:no-underline">
                        <div className="flex items-center gap-2">
                            <Code className="w-5 h-5 text-primary"/>
                            <span>Fix for: {patch.vulnerabilityType} at {patch.affectedComponent.substring(0,50)}{patch.affectedComponent.length > 50 ? '...' : ''}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-2 pb-4 space-y-2">
                      <h4 className="font-semibold mt-2">Explanation:</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{patch.explanation}</p>
                      <h4 className="font-semibold mt-2">Suggested Code ({patch.language || 'generic'}):</h4>
                      <ScrollArea className="max-h-60 w-full">
                        <pre className="bg-background p-3 rounded-md text-xs overflow-x-auto"><code>{patch.suggestedCodePatch}</code></pre>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          )}
           {patchSuggestions.length > 0 && (
            <CardFooter className="gap-2 border-t pt-4 mt-4">
                 <Button variant="outline" onClick={() => handleDownloadPatches("json")}>
                    <Download className="mr-2 h-4 w-4" /> Download as JSON
                </Button>
                <Button variant="outline" onClick={() => handleDownloadPatches("text")}>
                    <Download className="mr-2 h-4 w-4" /> Download as Text
                </Button>
            </CardFooter>
          )}
        </Card>
      )}


      <ReportDisplay
        scanId={scan.id}
        reportData={scan.aiSecurityReport}
        isLoading={isGeneratingReport}
        onGenerateReport={scan.status === 'completed' && scan.aiScanResult && !scan.aiSecurityReport && !scan.id.startsWith("mock-") ? handleGenerateReport : undefined}
        scanTargetUrl={scan.targetUrl}
        scanDate={scan.createdAt ? scan.createdAt.toDate() : new Date()}
        userDisplayName={user?.displayName || "User"}
      />

    </div>
  );
}
