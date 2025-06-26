
"use client";

import ScanForm from "@/components/dashboard/ScanForm";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, History, Bot, ShieldQuestion } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

export default function DashboardOverviewPage() {
  const { userProfile, scans } = useAuth();

  const summaryStatsData = useMemo(() => {
    const totalScans = scans.length;

    const criticalVulnerabilities = scans.reduce((count, scan) => {
      if (scan.aiScanResult?.vulnerabilities) {
        return count + scan.aiScanResult.vulnerabilities.filter(v => v.severity === 'Critical').length;
      }
      return count;
    }, 0);

    const recommendationsPending = scans.filter(scan => scan.status === 'completed' && !scan.aiSecurityReport).length;
    
    // This is a placeholder as simulated attacks are not stored in the database yet.
    const simulatedAttacksRun = 0; 

    return {
      totalScans,
      criticalVulnerabilities,
      recommendationsPending,
      simulatedAttacksRun,
    };
  }, [scans]);

  const summaryStats = [
    { title: "Total Scans Conducted", value: summaryStatsData.totalScans.toString(), icon: <History className="w-6 h-6 text-primary" />, color: "text-primary", link: "/dashboard/scans" },
    { title: "Critical Vulnerabilities (Active)", value: summaryStatsData.criticalVulnerabilities.toString(), icon: <AlertTriangle className="w-6 h-6 text-destructive" />, color: "text-destructive", link: "/dashboard/scans?severity=Critical" },
    { title: "AI Recommendations Pending", value: summaryStatsData.recommendationsPending.toString(), icon: <Bot className="w-6 h-6 text-blue-500" />, color: "text-blue-500", link: "/dashboard/scans?status=completed" },
    { title: "Simulated Attacks Run", value: summaryStatsData.simulatedAttacksRun.toString(), icon: <ShieldQuestion className="w-6 h-6 text-orange-500" />, color: "text-orange-500", link: "/dashboard/simulate-attack" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Welcome, {userProfile?.displayName || "User"}!
          </h1>
          <p className="text-muted-foreground">
            Your security overview. Start a new scan or review past results.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/scans">View Scan History</Link>
          </Button>
           <Button asChild variant="outline">
            <Link href="/dashboard/simulate-attack">Simulate Attack</Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat) => (
          <Card key={stat.title} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent className="pb-2">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
            {stat.link && (
                 <CardFooter className="pt-0">
                    <Button variant="link" size="sm" className="p-0 h-auto text-xs" asChild>
                        <Link href={stat.link}>View Details</Link>
                    </Button>
                </CardFooter>
            )}
          </Card>
        ))}
      </div>
      
      {/* New Scan Form */}
      <div>
        <ScanForm />
      </div>

      {/* Placeholder for Quick Overview of Latest Threats and AI Recommendations */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Bot className="mr-2 h-6 w-6 text-primary"/>Latest Threats & AI Recommendations</CardTitle>
          <CardDescription>Highlights from recent scans and general security advisories.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border p-4 rounded-lg bg-secondary/30">
            <h3 className="font-semibold text-primary">High Priority: Update Framework XYZ</h3>
            <p className="text-sm text-muted-foreground">A critical vulnerability (CVE-2023-XXXX) was found in Framework XYZ affecting version 2.1. We recommend updating to version 2.2 immediately.</p>
            <Button variant="link" size="sm" className="p-0 h-auto mt-1">Learn More (Placeholder)</Button>
          </div>
          <div className="border p-4 rounded-lg bg-secondary/30">
            <h3 className="font-semibold text-orange-600">AI Insight: Common Misconfiguration Detected</h3>
            <p className="text-sm text-muted-foreground">Our AI analysis of recent public breaches indicates a rise in attacks targeting misconfigured S3 buckets. Ensure your storage permissions are reviewed.</p>
             <Button variant="link" size="sm" className="p-0 h-auto mt-1">Best Practices (Placeholder)</Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">This section is for demonstration and uses placeholder data.</p>
        </CardContent>
        <CardFooter>
            <Button variant="outline" className="w-full">
                View All Security Advisories (Placeholder)
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
