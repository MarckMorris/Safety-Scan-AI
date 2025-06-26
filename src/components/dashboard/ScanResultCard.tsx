
"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Scan } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface ScanResultCardProps {
  scan: Scan;
}

const getStatusBadgeVariant = (status: Scan["status"]): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "completed":
      return "default";
    case "failed":
      return "destructive";
    case "scanning":
    case "generating_report":
    case "queued":
      return "secondary";
    default:
      return "outline";
  }
};

const getStatusIcon = (status: Scan["status"]) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4" />;
    case "failed":
      return <AlertTriangle className="w-4 h-4" />;
    case "scanning":
    case "generating_report":
      return <Loader2 className="w-4 h-4 animate-spin" />;
    case "queued":
        return <Clock className="w-4 h-4" />;  
    default:
      return <Clock className="w-4 h-4" />;
  }
}

export default function ScanResultCard({ scan }: ScanResultCardProps) {
  const vulnerabilityCount = scan.aiScanResult?.vulnerabilities?.length || 0;
  const criticalVulnerabilities = scan.aiScanResult?.vulnerabilities?.filter(v => v.severity === 'Critical').length || 0;
  const highVulnerabilities = scan.aiScanResult?.vulnerabilities?.filter(v => v.severity === 'High').length || 0;
  const mediumVulnerabilities = scan.aiScanResult?.vulnerabilities?.filter(v => v.severity === 'Medium').length || 0;
  const lowVulnerabilities = scan.aiScanResult?.vulnerabilities?.filter(v => v.severity === 'Low').length || 0;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg font-headline truncate" title={scan.targetUrl}>
                    {scan.targetUrl.length > 40 ? `${scan.targetUrl.substring(0, 37)}...` : scan.targetUrl}
                </CardTitle>
                <CardDescription>
                {scan.createdAt ? `Scanned ${formatDistanceToNow(scan.createdAt, { addSuffix: true })}` : 'Scan date unavailable'}
                </CardDescription>
            </div>
            <Badge variant={getStatusBadgeVariant(scan.status)} className="capitalize flex items-center gap-1.5 text-xs px-2 py-1">
                {getStatusIcon(scan.status)}
                <span>{scan.status.replace('_', ' ')}</span>
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex items-center">
        {scan.status === "completed" && scan.aiScanResult ? (
            vulnerabilityCount > 0 ? (
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Found <span className="font-bold text-foreground">{vulnerabilityCount}</span> potential {vulnerabilityCount === 1 ? 'vulnerability' : 'vulnerabilities'}.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {criticalVulnerabilities > 0 && <Badge variant="destructive">Critical: {criticalVulnerabilities}</Badge>}
                        {highVulnerabilities > 0 && <Badge variant="outline" className="border-orange-500 text-orange-500">High: {highVulnerabilities}</Badge>}
                        {mediumVulnerabilities > 0 && <Badge variant="outline" className="border-yellow-500 text-yellow-500">Medium: {mediumVulnerabilities}</Badge>}
                        {lowVulnerabilities > 0 && <Badge variant="outline" className="border-green-500 text-green-500">Low: {lowVulnerabilities}</Badge>}
                    </div>
                </div>
            ) : (
                <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <p className="font-semibold">No vulnerabilities found</p>
                </div>
            )
        ) : scan.status === "failed" ? (
            <div className="flex items-start space-x-3 text-destructive">
                <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                    <p className="font-semibold">Scan Failed</p>
                    <p className="text-xs line-clamp-3" title={scan.errorMessage || "Unknown error"}>
                        {scan.errorMessage || "An unknown error occurred."}
                    </p>
                </div>
            </div>
        ) : (
            <div className="flex items-center space-x-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p>Scan in progress...</p>
            </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4 mt-auto">
        <Button variant="outline" asChild className="w-full">
          <Link href={`/dashboard/scans/${scan.id}?targetUrl=${encodeURIComponent(scan.targetUrl)}`}>
            View Details <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
