
"use client";

import type { AISecurityReport } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReportDisplayProps {
  reportData?: AISecurityReport;
  isLoading?: boolean;
  onGenerateReport?: () => void;
  scanTargetUrl?: string;
}

export default function ReportDisplay({ reportData, isLoading, onGenerateReport, scanTargetUrl }: ReportDisplayProps) {
  const handleDownloadPdf = () => {
    // Placeholder for PDF download functionality
    alert("PDF download functionality is not yet implemented.");
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle className="text-xl font-headline flex items-center">
            <FileText className="w-6 h-6 mr-2 text-primary" />
            AI Security Improvement Report
          </CardTitle>
          {scanTargetUrl && <CardDescription>Recommendations for {scanTargetUrl}</CardDescription>}
        </div>
        {reportData && (
          <Button variant="outline" onClick={handleDownloadPdf} disabled>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading && !reportData && (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Generating report...</p>
          </div>
        )}
        {!isLoading && !reportData && onGenerateReport && (
           <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No report generated yet for this scan.</p>
            <Button onClick={onGenerateReport}>
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
          This report is AI-generated. Always verify recommendations with security professionals.
        </p>
      </CardFooter>}
    </Card>
  );
}
