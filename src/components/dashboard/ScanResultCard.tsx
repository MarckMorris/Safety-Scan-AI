
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
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "failed":
      return <AlertTriangle className="w-4 h-4 text-destructive" />;
    case "scanning":
    case "generating_report":
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    case "queued":
        return <Clock className="w-4 h-4 text-muted-foreground" />;  
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
}

export default function ScanResultCard({ scan }: ScanResultCardProps) {
  const vulnerabilityCount = scan.aiScanResult?.vulnerabilities?.length || 0;
  const criticalVulnerabilities = scan.aiScanResult?.vulnerabilities?.filter(v => v.severity === 'Critical').length || 0;
  const highVulnerabilities = scan.aiScanResult?.vulnerabilities?.filter(v => v.severity === 'High').length || 0;

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
            <Badge variant={getStatusBadgeVariant(scan.status)} className="capitalize flex items-center gap-1">
                {getStatusIcon(scan.status)}
                {scan.status.replace('_', ' ')}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        {scan.status === "completed" && scan.aiScanResult ? (
          <>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {scan.aiScanResult.summary}
            </p>
            <div className="flex justify-between text-sm pt-2">
                <span className={vulnerabilityCount > 0 ? 'text-destructive font-semibold' : 'text-green-600 font-semibold'}>
                    {vulnerabilityCount} {vulnerabilityCount === 1 ? 'vulnerability' : 'vulnerabilities'}
                </span>
                <div className="space-x-2">
                    {criticalVulnerabilities > 0 && <Badge variant="destructive">Critical: {criticalVulnerabilities}</Badge>}
                    {highVulnerabilities > 0 && <Badge variant="outline" className="border-orange-500 text-orange-500">High: {highVulnerabilities}</Badge>}
                </div>
            </div>
          </>
        ) : scan.status === "failed" ? (
            <p className="text-sm text-destructive">Scan failed: {scan.errorMessage || "Unknown error"}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Scan is currently {scan.status.replace('_', ' ')}...</p>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button variant="outline" asChild className="w-full">
          <Link href={`/dashboard/scans/${scan.id}?targetUrl=${encodeURIComponent(scan.targetUrl)}`}>
            View Details <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
