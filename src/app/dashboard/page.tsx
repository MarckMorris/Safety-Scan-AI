
"use client";

import ScanForm from "@/components/dashboard/ScanForm";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, CheckCircle2, History } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardOverviewPage() {
  const { userProfile } = useAuth();

  // Placeholder data for summary cards
  const summaryStats = [
    { title: "Total Scans", value: "0", icon: <History className="w-6 h-6 text-primary" />, color: "text-primary" },
    { title: "Vulnerabilities Found (Last 7d)", value: "0", icon: <AlertTriangle className="w-6 h-6 text-destructive" />, color: "text-destructive" },
    { title: "Resolved Issues (Last 7d)", value: "0", icon: <CheckCircle2 className="w-6 h-6 text-green-500" />, color: "text-green-500" },
    { title: "Active Scan Status", value: "Idle", icon: <Activity className="w-6 h-6 text-blue-500" />, color: "text-blue-500" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Welcome, {userProfile?.displayName || "User"}!
          </h1>
          <p className="text-muted-foreground">
            Ready to secure your applications? Start a new scan or review your history.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/scans">View Scan History</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat) => (
          <Card key={stat.title} className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <ScanForm />
      </div>

      {/* Placeholder for recent activity or alerts */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline">Recent Activity</CardTitle>
          <CardDescription>No recent activity to display.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Your latest scan activities and critical alerts will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
