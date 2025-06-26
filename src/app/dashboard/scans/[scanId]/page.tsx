
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Scan, AISecurityReport, Vulnerability, AIPatchSuggestion } from "@/types";
import VulnerabilityItem from "@/components/dashboard/VulnerabilityItem";
import ReportDisplay from "@/components/dashboard/ReportDisplay";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, AlertTriangle, Clock, Loader2, FileText, Download, Wand2, Code, AlertCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { generateSecurityImprovementReport } from "@/ai/flows/generate-security-improvement-report";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

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
  const { user, userProfile, loading: authLoading, scans, updateScan } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  const initialTargetUrl = useMemo(() => {
    const urlFromQuery = searchParams.get("targetUrl");
    return urlFromQuery ? decodeURIComponent(urlFromQuery) : null;
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    if (authLoading) return;

    if (!user) {
        router.push("/auth/login");
        return;
    }

    const foundScan = scans.find(s => s.id === scanId);
    
    if (foundScan) {
        setScan(foundScan);
    } else if (initialTargetUrl && user) {
        // Create a placeholder if scan is new and not in the state yet
        setScan({
            id: scanId,
            userId: user.uid,
            targetUrl: initialTargetUrl,
            status: 'queued', 
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    } else if (!foundScan && scans.length > 0) {
        toast({ title: "Scan Not Found", description: `The scan with ID ${scanId} could not be found.`, variant: "destructive" });
        router.push("/dashboard/scans");
    }
    setLoading(false);
  }, [scanId, scans, authLoading, user, initialTargetUrl, router, toast]);

  const handleGenerateReport = async () => {
    if (!scan || !scan.aiScanResult || !user || scan.status !== 'completed') {
      toast({ title: "Cannot Generate Report", description: "Scan data incomplete, user not found, or scan not completed.", variant: "destructive" });
      return;
    }

    setIsGeneratingReport(true);
    await updateScan(scan.id, { status: "generating_report" });
    
    try {
      const aiReportOutput = await generateSecurityImprovementReport({
        scanResults: JSON.stringify(scan.aiScanResult),
      });
      
      const newReport: AISecurityReport = { report: aiReportOutput.report };

      await updateScan(scan.id, {
        aiSecurityReport: newReport,
        status: "completed",
      });
      toast({ title: "Report Generated", description: "Security improvement report successfully generated." });

    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({ title: "Report Generation Failed", description: error.message || "Could not generate report.", variant: "destructive" });
      await updateScan(scan.id, { status: "completed" });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const displayTargetUrl = scan?.targetUrl || initialTargetUrl;
  const vulnerabilities = scan?.aiScanResult?.vulnerabilities || [];

  if (loading || authLoading) { 
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
         <Button variant="outline" onClick={() => router.back()} className="mb-6 absolute top-4 left-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4 mt-12" />
        <h2 className="text-2xl font-semibold mb-2">Scan Not Found</h2>
        <p className="text-muted-foreground mb-6">The scan (ID: {scanId}) could not be loaded or does not exist.</p>
        <Button onClick={() => router.push('/dashboard/scans')}>Go to Scan History</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div>
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Scans
        </Button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 mb-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline truncate" title={displayTargetUrl || "Loading URL..."}>{displayTargetUrl || "Loading URL..."}</h1>
                <p className="text-sm text-muted-foreground">
                    Queued/Scanned on: {scan?.createdAt ? format(scan.createdAt, "MMM dd, yyyy 'at' hh:mm a") : 'N/A'}
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

      {(scan?.status === "scanning" || scan?.status === "queued") && !scan?.aiScanResult && (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center">
                    <Loader2 className="w-6 h-6 mr-2 text-primary animate-spin" /> 
                    Scan for {displayTargetUrl || "target"} is {scan?.status?.replace('_',' ') || "being prepared"}...
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

      {scan?.aiScanResult && (
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
                <p className="text-muted-foreground">This scan did not detect any vulnerabilities for {displayTargetUrl}.</p>
              </div>
            ) : null }
          </CardContent>
        </Card>
      )}
      
      <ReportDisplay
        scanId={scan?.id}
        reportData={scan?.aiSecurityReport}
        isLoading={isGeneratingReport || scan?.status === 'generating_report'}
        onGenerateReport={scan?.status === 'completed' && scan?.aiScanResult && !scan?.aiSecurityReport ? handleGenerateReport : undefined}
        scanTargetUrl={displayTargetUrl || undefined}
        scanDate={scan?.createdAt ? scan.createdAt : new Date()}
        userDisplayName={userProfile?.displayName || "User"}
      />
    </div>
  );
}
