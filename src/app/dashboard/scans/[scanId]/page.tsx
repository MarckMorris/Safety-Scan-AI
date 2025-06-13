
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Scan, AISecurityReport, Vulnerability } from "@/types";
import VulnerabilityItem from "@/components/dashboard/VulnerabilityItem";
import ReportDisplay from "@/components/dashboard/ReportDisplay";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, AlertTriangle, Clock, Loader2, RefreshCw, FileText, Download, Wand2, Code, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { generateSecurityImprovementReport } from "@/ai/flows/generate-security-improvement-report";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

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
    case "scanning": case "generating_report": return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    case "queued": return <Clock className="w-5 h-5 text-muted-foreground" />;  
    default: return <Clock className="w-5 h-5 text-muted-foreground" />;
  }
};

// Placeholder for AI Patch Suggestion data
interface AIPatchSuggestion {
  vulnerabilityType: string;
  affectedComponent: string; // e.g., "login.php line 52" or "UserRegistrationForm component"
  suggestion: string; // The code snippet
  explanation: string;
}


export default function ScanDetailPage() {
  const params = useParams();
  const scanId = params.scanId as string;
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [patchSuggestions, setPatchSuggestions] = useState<AIPatchSuggestion[]>([]);
  const [isLoadingPatches, setIsLoadingPatches] = useState(false);

  useEffect(() => {
    if (!user || !scanId) return;

    setLoading(true);
    const scanDocRef = doc(db, "users", user.uid, "scans", scanId);
    
    const fetchScan = async () => {
        try {
            const docSnap = await getDoc(scanDocRef);
            if (docSnap.exists()) {
                setScan({ id: docSnap.id, ...docSnap.data() } as Scan);
            } else {
                toast({ title: "Error", description: "Scan not found. It might be a mock scan.", variant: "destructive" });
                // Attempt to load mock scan if ID matches
                const mockScan = (await import('@/app/dashboard/scans/page.tsx').then(m => m.mockScansData || [])).find(s => s.id === scanId);
                if (mockScan) {
                    setScan(mockScan);
                    toast({ title: "Displaying Mock Scan", description: "Real scan not found in database, showing mock data.", variant: "default" });
                } else {
                    router.push("/dashboard/scans");
                }
            }
        } catch (error) {
            console.error("Error fetching scan details:", error);
            toast({ title: "Error", description: "Could not fetch scan details. Trying mock data.", variant: "destructive" });
            const mockScan = (await import('@/app/dashboard/scans/page.tsx').then(m => m.mockScansData || [])).find(s => s.id === scanId);
            if (mockScan) setScan(mockScan); else router.push("/dashboard/scans");
        } finally {
            setLoading(false);
        }
    };
    fetchScan();
  }, [user, scanId, router, toast]);

  const handleGenerateReport = async () => {
    if (!scan || !scan.aiScanResult || !user || scan.id.startsWith("mock")) { // Don't try for mock scans
      toast({ title: "Cannot Generate Report", description: "Scan data is incomplete, user not found, or this is a mock scan.", variant: "destructive" });
      return;
    }

    setIsGeneratingReport(true);
    const scanDocRef = doc(db, "users", user.uid, "scans", scanId);
    
    try {
      await updateDoc(scanDocRef, { status: "generating_report", updatedAt: serverTimestamp() });
      setScan(prev => prev ? {...prev, status: "generating_report"} : null);

      const aiReport: AISecurityReport = await generateSecurityImprovementReport({
        scanResults: JSON.stringify(scan.aiScanResult),
      });

      await updateDoc(scanDocRef, {
        aiSecurityReport: aiReport,
        status: "completed",
        updatedAt: serverTimestamp(),
      });
      
      setScan(prev => prev ? {...prev, aiSecurityReport: aiReport, status: "completed", updatedAt: Timestamp.now()} : null);
      toast({ title: "Report Generated", description: "Security improvement report successfully generated." });

    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({ title: "Report Generation Failed", description: error.message || "Could not generate report.", variant: "destructive" });
      await updateDoc(scanDocRef, { status: "completed", updatedAt: serverTimestamp() });
      setScan(prev => prev ? {...prev, status: "completed"} : null);
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
    // e.g., const suggestions = await generatePatchSuggestionsFlow({ vulnerabilities: scan.aiScanResult.vulnerabilities });
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    const mockSuggestions: AIPatchSuggestion[] = scan.aiScanResult.vulnerabilities.map(v => ({
        vulnerabilityType: v.type,
        affectedComponent: v.affectedUrl || v.affectedFile || "Unknown component",
        suggestion: `// Placeholder fix for ${v.type}\nconsole.log("Apply security patch for ${v.description.substring(0,30)}...");`,
        explanation: `This is a mock patch. For ${v.type}, ensure proper input validation and output encoding. The vulnerability was found at ${v.affectedUrl || v.affectedFile || 'N/A'}. Severity: ${v.severity}.`
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
        : patchSuggestions.map(p => `Vulnerability: ${p.vulnerabilityType}\nAffected: ${p.affectedComponent}\nSuggestion:\n${p.suggestion}\nExplanation:\n${p.explanation}\n\n---\n\n`).join('');
    
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
          <p className="ml-4 text-lg text-muted-foreground">Loading scan details...</p>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Scan Not Found</h2>
        <p className="text-muted-foreground mb-6">The requested scan could not be loaded or does not exist.</p>
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

      {scan.aiScanResult && (
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
            ) : (
                 <div className="text-center py-8">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-lg font-medium">Scan in progress or status unclear...</p>
                    <p className="text-muted-foreground">Vulnerability details will appear here once available.</p>
                </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Patch Suggestion Engine Placeholder */}
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
                    <AccordionTrigger className="px-4 text-left">
                        <div className="flex items-center gap-2">
                            <Code className="w-5 h-5 text-primary"/>
                            <span>Fix for: {patch.vulnerabilityType} at {patch.affectedComponent.substring(0,50)}{patch.affectedComponent.length > 50 ? '...' : ''}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 space-y-2">
                      <h4 className="font-semibold mt-2">Explanation:</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{patch.explanation}</p>
                      <h4 className="font-semibold mt-2">Suggested Code:</h4>
                      <pre className="bg-background p-3 rounded-md text-xs overflow-x-auto"><code>{patch.suggestion}</code></pre>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          )}
           {patchSuggestions.length > 0 && (
            <CardFooter className="gap-2">
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
        onGenerateReport={scan.status === 'completed' && scan.aiScanResult && !scan.aiSecurityReport && !scan.id.startsWith("mock") ? handleGenerateReport : undefined}
        scanTargetUrl={scan.targetUrl}
        scanDate={scan.createdAt ? scan.createdAt.toDate() : new Date()}
        userDisplayName={user?.displayName || "User"}
      />

    </div>
  );
}
