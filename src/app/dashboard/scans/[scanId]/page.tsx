
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Scan, AISecurityReport } from "@/types";
import VulnerabilityItem from "@/components/dashboard/VulnerabilityItem";
import ReportDisplay from "@/components/dashboard/ReportDisplay";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, AlertTriangle, Clock, Loader2, RefreshCw, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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


export default function ScanDetailPage() {
  const params = useParams();
  const scanId = params.scanId as string;
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    if (!user || !scanId) return;

    setLoading(true);
    const scanDocRef = doc(db, "users", user.uid, "scans", scanId);
    
    // Using onSnapshot for real-time updates might be better for status changes
    // but getDoc is simpler for initial load.
    const fetchScan = async () => {
        try {
            const docSnap = await getDoc(scanDocRef);
            if (docSnap.exists()) {
                setScan({ id: docSnap.id, ...docSnap.data() } as Scan);
            } else {
                toast({ title: "Error", description: "Scan not found.", variant: "destructive" });
                router.push("/dashboard/scans");
            }
        } catch (error) {
            console.error("Error fetching scan details:", error);
            toast({ title: "Error", description: "Could not fetch scan details.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    fetchScan();
  }, [user, scanId, router, toast]);

  const handleGenerateReport = async () => {
    if (!scan || !scan.aiScanResult || !user) {
      toast({ title: "Cannot Generate Report", description: "Scan data is incomplete or user not found.", variant: "destructive" });
      return;
    }

    setIsGeneratingReport(true);
    const scanDocRef = doc(db, "users", user.uid, "scans", scanId);
    
    try {
      // Update status to 'generating_report'
      await updateDoc(scanDocRef, { status: "generating_report", updatedAt: serverTimestamp() });
      setScan(prev => prev ? {...prev, status: "generating_report"} : null);

      const aiReport: AISecurityReport = await generateSecurityImprovementReport({
        scanResults: JSON.stringify(scan.aiScanResult), // Pass the full scan result as a JSON string
      });

      await updateDoc(scanDocRef, {
        aiSecurityReport: aiReport,
        status: "completed", // Assuming report generation is the final step
        updatedAt: serverTimestamp(),
      });
      
      setScan(prev => prev ? {...prev, aiSecurityReport: aiReport, status: "completed", updatedAt: Timestamp.now()} : null);
      toast({ title: "Report Generated", description: "Security improvement report successfully generated." });

    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({ title: "Report Generation Failed", description: error.message || "Could not generate report.", variant: "destructive" });
      await updateDoc(scanDocRef, { status: "completed", updatedAt: serverTimestamp() }); // Revert status or set to failed_report_generation
      setScan(prev => prev ? {...prev, status: "completed"} : null); // Revert status
    } finally {
      setIsGeneratingReport(false);
    }
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
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
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
                    Scanned on: {format(scan.createdAt.toDate(), "MMM dd, yyyy 'at' hh:mm a")}
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
                  <VulnerabilityItem key={index} vulnerability={vuln} />
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
                    <p className="text-lg font-medium">Scan in progress...</p>
                    <p className="text-muted-foreground">Vulnerability details will appear here once the scan is complete.</p>
                </div>
            )}
          </CardContent>
        </Card>
      )}

      <ReportDisplay 
        reportData={scan.aiSecurityReport} 
        isLoading={isGeneratingReport}
        onGenerateReport={scan.status === 'completed' && scan.aiScanResult && !scan.aiSecurityReport ? handleGenerateReport : undefined}
        scanTargetUrl={scan.targetUrl}
      />

    </div>
  );
}
