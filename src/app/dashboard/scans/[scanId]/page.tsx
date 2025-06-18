
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, onSnapshot, Timestamp, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Scan, AISecurityReport, Vulnerability, AIPatchSuggestion } from "@/types";
import VulnerabilityItem from "@/components/dashboard/VulnerabilityItem";
import ReportDisplay from "@/components/dashboard/ReportDisplay";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, AlertTriangle, Clock, Loader2, FileText, Download, Wand2, Code, AlertCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { generateSecurityImprovementReport } from "@/ai/flows/generate-security-improvement-report";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { mockScansData } from "@/app/dashboard/scans/page";


const getStatusBadgeVariant = (status?: Scan["status"]): "default" | "secondary" | "destructive" | "outline" => {
  if (!status) return "outline";
  switch (status) {
    case "completed": return "default";
    case "failed": return "destructive";
    case "scanning": case "generating_report": case "queued": return "secondary";
    default: return "outline";
  }
};

const getStatusIcon = (status?: Scan["status"]) => {
  if (!status) return <Clock className="w-5 h-5 text-muted-foreground" />;
  switch (status) {
    case "completed": return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "failed": return <AlertTriangle className="w-5 h-5 text-destructive" />;
    case "scanning": case "generating_report": return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
    case "queued": return <Clock className="w-5 h-5 text-muted-foreground" />;
    default: return <Clock className="w-5 h-5 text-muted-foreground" />;
  }
};


export default function ScanDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const scanId = params.scanId as string;
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [patchSuggestions, setPatchSuggestions] = useState<AIPatchSuggestion[]>([]);
  const [isLoadingPatches, setIsLoadingPatches] = useState(false);
  
  const initialTargetUrl = useMemo(() => {
    const urlFromQuery = searchParams.get("targetUrl");
    return urlFromQuery ? decodeURIComponent(urlFromQuery) : null;
  }, [searchParams]);

  const toastTimeouts = useMemo(() => new Map<string, NodeJS.Timeout>(), []);


  useEffect(() => {
    if (!scanId) {
      router.push("/dashboard/scans"); // Redirect if scanId is missing
      return;
    }
    
    setLoading(true);

    // If user is not available (e.g. mock auth failed, or initial load), 
    // try to use mock data for UI demo if a mock scanId matches.
    if (!user) {
        const mockScan = mockScansData.find(s => s.id === scanId);
        if (mockScan) {
            setScan(mockScan);
        } else {
             // If no mock user and no matching mock scan, behavior might depend on requirements.
             // For now, let's assume it should go back or show 'not found' after timeout.
            console.warn(`Scan detail page: User not available, and no mock scan for ID ${scanId}. Waiting for timeout or Firestore data.`);
        }
        // setLoading will be handled by timeout or Firestore listener
    }


    const scanDocRef = user ? doc(db, "users", user.uid, "scans", scanId) : null;
    let unsubscribe: (() => void) | null = null;

    if (scanDocRef) {
        unsubscribe = onSnapshot(scanDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const scanData = { id: docSnap.id, ...docSnap.data() } as Scan;
            setScan(scanData);
            if (scanData.status === "failed" && scanData.errorMessage && !toastTimeouts.has(`fail-${scanId}`)) {
                toast({ title: `Scan Failed: ${scanData.targetUrl}`, description: scanData.errorMessage, variant: "destructive" });
                toastTimeouts.set(`fail-${scanId}`, setTimeout(() => toastTimeouts.delete(`fail-${scanId}`), 5000));
            }
            setLoading(false);
        } else {
            console.log(`Scan document ${scanId} not found in Firestore. Current user: ${user?.uid}.`);
            // Attempt to set a temporary 'queued' state if initialTargetUrl is present,
            // this helps the UI show something while waiting for the background process to create the doc.
            if (!scan && initialTargetUrl && user) {
                setScan({
                    id: scanId,
                    userId: user.uid,
                    targetUrl: initialTargetUrl,
                    status: 'queued', // Or 'scanning' if ScanForm sets it directly
                    createdAt: Timestamp.now(), // Placeholder, actual time will be from Firestore
                    updatedAt: Timestamp.now(),
                    aiScanResult: null,
                    aiSecurityReport: null,
                });
            }
            // Keep loading as true, timeout will handle if doc never appears
        }
        }, (error) => {
        console.error("Error fetching scan details with onSnapshot:", error);
        toast({ title: "Error Fetching Scan", description: "Could not fetch scan details. Trying mock data.", variant: "destructive" });
        const mockScan = mockScansData.find(s => s.id === scanId);
        if (mockScan) {
            setScan(mockScan);
        }
        setLoading(false);
        });
    }


    const timer = setTimeout(() => {
        if (loading && !scan) { 
            setLoading(false);
            const mockScan = mockScansData.find(s => s.id === scanId);
            if (mockScan) {
                setScan(mockScan);
                toast({ title: "Loading Timeout", description: "Displaying mock data for this scan as live data could not be loaded.", variant: "default" });
            } else {
                 toast({ title: "Scan Not Found", description: "The scan data could not be loaded after a timeout. Please try again or check history.", variant: "destructive" });
                 router.push("/dashboard/scans");
            }
        }
    }, 7000); // 7 seconds timeout

    return () => {
        if (unsubscribe) unsubscribe();
        clearTimeout(timer);
        toastTimeouts.forEach(clearTimeout);
        toastTimeouts.clear();
    };
  }, [scanId, user, router, toast, initialTargetUrl, toastTimeouts]); // Removed scan and loading from dependencies


  const handleGenerateReport = async () => {
    if (!scan || !scan.aiScanResult || !user || scan.id.startsWith("mock-") || scan.status !== 'completed') {
      toast({ title: "Cannot Generate Report", description: "Scan data incomplete, user not found, scan is mock, or scan not completed.", variant: "destructive" });
      return;
    }
    if (!scan.id) {
        toast({ title: "Scan ID Missing", description: "Cannot generate report without a valid scan ID.", variant: "destructive"});
        return;
    }

    setIsGeneratingReport(true);
    const scanDocRef = doc(db, "users", user.uid, "scans", scan.id);
    
    try {
      setScan(prev => prev ? {...prev, status: "generating_report"} : null);
      await updateDoc(scanDocRef, { status: "generating_report", updatedAt: serverTimestamp() });

      const aiReportOutput = await generateSecurityImprovementReport({
        scanResults: JSON.stringify(scan.aiScanResult),
      });
      
      const newReport: AISecurityReport = { report: aiReportOutput.report };

      setScan(prev => prev ? {...prev, aiSecurityReport: newReport, status: "completed", updatedAt: Timestamp.now()} : null);
      await updateDoc(scanDocRef, {
        aiSecurityReport: newReport,
        status: "completed",
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Report Generated", description: "Security improvement report successfully generated." });

    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({ title: "Report Generation Failed", description: error.message || "Could not generate report.", variant: "destructive" });
      setScan(prev => prev ? {...prev, status: "completed"} : null);
      await updateDoc(scanDocRef, { status: "completed", updatedAt: serverTimestamp() }).catch(err => console.error("Failed to revert status to completed", err));
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
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockSuggestions: AIPatchSuggestion[] = scan.aiScanResult.vulnerabilities.map(v => ({
        vulnerabilityType: v.type,
        vulnerabilityDescription: v.description,
        affectedComponent: v.affectedUrl || v.affectedFile || "Unknown component",
        suggestedCodePatch: `// Mock fix for ${v.type}\nconsole.log("Secure this: ${v.description.substring(0,30)}...");`,
        explanation: `This is a mock patch explanation for ${v.type} at ${v.affectedUrl || v.affectedFile || 'N/A'}. Severity: ${v.severity}. Ensure all inputs are validated and outputs encoded.`,
        language: 'javascript'
    }));
    setPatchSuggestions(mockSuggestions);
    setIsLoadingPatches(false);
    toast({ title: "Patch Suggestions Generated (Mock)", description: "Displaying mock patch suggestions." });
  };

  const handleDownloadPatches = (formatType: "json" | "text") => {
    if (patchSuggestions.length === 0) {
        toast({title: "No Patches", description: "No patch suggestions to download.", variant: "default"});
        return;
    }
    const dataStr = formatType === "json"
        ? JSON.stringify(patchSuggestions, null, 2)
        : patchSuggestions.map(p => `Vulnerability: ${p.vulnerabilityType}\nAffected: ${p.affectedComponent}\nSuggestion:\n${p.suggestedCodePatch}\nExplanation:\n${p.explanation}\n\n---\n\n`).join('');
    
    const dataUri = `data:text/${formatType};charset=utf-8,${encodeURIComponent(dataStr)}`;
    const downloadLink = document.createElement('a');
    downloadLink.setAttribute('href', dataUri);
    downloadLink.setAttribute('download', `patch_suggestions_${scanId}.${formatType}`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast({title: "Patches Downloaded", description: `Patch suggestions downloaded as ${formatType}.`});
  };

  if (loading && !scan) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Scans
        </Button>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading scan details for {initialTargetUrl || scanId}...</p>
        </div>
      </div>
    );
  }

  if (!scan && !loading) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Scan Not Found</h2>
        <p className="text-muted-foreground mb-6">The scan (ID: {scanId}) could not be loaded or does not exist.</p>
        <Button onClick={() => router.push('/dashboard/scans')}>Go to Scan History</Button>
      </div>
    );
  }
  
  const currentTargetUrl = scan?.targetUrl || initialTargetUrl;
  const vulnerabilities = scan?.aiScanResult?.vulnerabilities || [];

  return (
    <div className="space-y-8">
      <div>
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Scans
        </Button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 mb-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline truncate" title={currentTargetUrl || "Loading URL..."}>{currentTargetUrl || "Loading URL..."}</h1>
                <p className="text-sm text-muted-foreground">
                    Queued/Scanned on: {scan?.createdAt ? format(scan.createdAt.toDate(), "MMM dd, yyyy 'at' hh:mm a") : 'N/A'}
                    {scan?.updatedAt && scan?.createdAt?.seconds !== scan?.updatedAt?.seconds && (
                       ` (Updated: ${format(scan.updatedAt.toDate(), "hh:mm a")})`
                    )}
                </p>
            </div>
            <Badge variant={getStatusBadgeVariant(scan?.status)} className="text-base px-4 py-2 capitalize flex items-center gap-2">
                {getStatusIcon(scan?.status)}
                {scan?.status?.replace('_', ' ') || 'Loading...'}
            </Badge>
        </div>
      </div>
      
      {scan?.status === "failed" && (
        <Card className="border-destructive bg-destructive/10">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle/>Scan Failed</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive-foreground">{scan.errorMessage || "An unknown error occurred during the scan."}</p>
            </CardContent>
        </Card>
      )}

      {(scan?.status === "scanning" || scan?.status === "queued" || (loading && scan?.status !== 'completed' && scan?.status !== 'failed')) && !scan?.aiScanResult && (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center">
                    <Loader2 className="w-6 h-6 mr-2 text-primary animate-spin" /> 
                    Scan for {currentTargetUrl || "target"} is {scan?.status?.replace('_',' ') || "being prepared"}...
                </CardTitle>
                <CardDescription>Results will appear here once available. This page updates automatically.</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium">Please wait...</p>
                <p className="text-muted-foreground">You can navigate away; the scan will continue in the background.</p>
            </CardContent>
        </Card>
      )}

      {scan?.aiScanResult && (scan?.status === "completed" || scan?.status === "generating_report") && (
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
                  <VulnerabilityItem key={`${scan?.id}-vuln-${index}`} vulnerability={vuln} index={index}/>
                ))}
              </Accordion>
            ) : scan?.status === 'completed' ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium">No vulnerabilities found!</p>
                <p className="text-muted-foreground">This scan did not detect any vulnerabilities for {currentTargetUrl}.</p>
              </div>
            ) : null }
          </CardContent>
        </Card>
      )}

      {scan?.status === 'completed' && vulnerabilities.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
                <CardTitle className="text-xl font-headline flex items-center">
                    <Wand2 className="w-6 h-6 mr-2 text-primary" /> AI Patch Suggestions (Mock)
                </CardTitle>
                <CardDescription>Get AI-powered code suggestions to fix identified vulnerabilities.</CardDescription>
            </div>
            {!patchSuggestions.length && (
                <Button onClick={handleGeneratePatchSuggestions} disabled={isLoadingPatches}>
                {isLoadingPatches ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Generate Patches
                </Button>
            )}
          </CardHeader>
          {patchSuggestions.length > 0 && (
            <CardContent>
              <Accordion type="multiple" className="w-full space-y-2">
                {patchSuggestions.map((patch, index) => (
                  <AccordionItem value={`patch-${index}`} key={`${scan?.id}-patch-${index}`} className="bg-muted/50 rounded-md">
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
          {!patchSuggestions.length && isLoadingPatches && (
            <CardContent className="text-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">Generating patch suggestions...</p>
            </CardContent>
          )}
        </Card>
      )}


      <ReportDisplay
        scanId={scan?.id}
        reportData={scan?.aiSecurityReport}
        isLoading={isGeneratingReport}
        onGenerateReport={scan?.status === 'completed' && scan?.aiScanResult && !scan?.aiSecurityReport && !scan?.id.startsWith("mock-") ? handleGenerateReport : undefined}
        scanTargetUrl={currentTargetUrl || undefined}
        scanDate={scan?.createdAt ? scan.createdAt.toDate() : new Date()}
        userDisplayName={user?.displayName || "User"}
      />
      {scan?.id.startsWith("mock-") && (
         <Card className="border-amber-500 bg-amber-50 mt-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-amber-600" />
                <p className="text-sm text-amber-700">
                  This is mock scan data for demonstration purposes. Features like report generation may be disabled.
                </p>
              </div>
            </CardContent>
          </Card>
      )}
    </div>
  );
}

    