
"use client";

import type { AISecurityReport } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, ShieldAlert } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface ReportDisplayProps {
  scanId?: string; // For naming the PDF
  reportData?: AISecurityReport;
  isLoading?: boolean;
  onGenerateReport?: () => void;
  scanTargetUrl?: string;
  scanDate?: Date;
  userDisplayName?: string;
}

export default function ReportDisplay({ 
    scanId, 
    reportData, 
    isLoading, 
    onGenerateReport, 
    scanTargetUrl,
    scanDate,
    userDisplayName
}: ReportDisplayProps) {

  const handleDownloadPdf = () => {
    // Placeholder for actual PDF generation.
    // In a real app, this would trigger a client-side or server-side PDF generation process.
    // For now, it just shows an alert.
    alert(`PDF download for report on ${scanTargetUrl} (Placeholder).\nActual PDF generation requires a library like jsPDF or a backend service.`);
    
    // Example of what might be included in a PDF if generated client-side:
    console.log("--- PDF Content (Placeholder) ---");
    console.log(`Safety Scan AI - Security Report`);
    console.log(`---------------------------------`);
    if (userDisplayName) console.log(`Generated for: ${userDisplayName}`);
    if (scanTargetUrl) console.log(`Target: ${scanTargetUrl}`);
    if (scanDate) console.log(`Scan Date: ${format(scanDate, "MMM dd, yyyy 'at' hh:mm a")}`);
    console.log(`---------------------------------`);
    if (reportData?.report) {
        console.log(reportData.report);
    } else {
        console.log("No report content available.");
    }
    console.log(`--- End of PDF Content ---`);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-2">
        <div>
          <CardTitle className="text-xl font-headline flex items-center">
            <FileText className="w-6 h-6 mr-2 text-primary" />
            AI Security Improvement Report
          </CardTitle>
          {scanTargetUrl && <CardDescription>Recommendations for {scanTargetUrl}</CardDescription>}
        </div>
        {reportData && (
          <Button variant="outline" onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            Download Report (PDF)
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading && !reportData && (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Generating AI security report for {scanTargetUrl}...</p>
            <p className="text-xs text-muted-foreground mt-1">This may take a moment.</p>
          </div>
        )}
        {!isLoading && !reportData && onGenerateReport && (
           <div className="text-center py-8">
            <ShieldAlert className="mx-auto h-12 w-12 text-primary mb-4" />
            <p className="text-muted-foreground mb-4">No AI-generated security report available yet for this scan.</p>
            <Button onClick={onGenerateReport} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Generate Security Report
            </Button>
          </div>
        )}
        {reportData && (
          <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-secondary/30">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-body">
              {reportData.report}
            </pre>
          </ScrollArea>
        )}
      </CardContent>
      {reportData && <CardFooter>
        <p className="text-xs text-muted-foreground">
          This report is AI-generated. Always verify recommendations with security professionals before implementation. Report for scan ID: {scanId || "N/A"}.
        </p>
      </CardFooter>}
    </Card>
  );
}
