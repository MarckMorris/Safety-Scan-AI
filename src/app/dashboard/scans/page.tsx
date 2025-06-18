
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Scan } from "@/types";
import ScanResultCard from "@/components/dashboard/ScanResultCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Search, ListFilter, LayoutGrid, Loader2, History, AlertTriangle, Download, CheckCircle, Clock } from "lucide-react"; // Added CheckCircle, Clock
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns'; // Removed formatDistanceToNow as it wasn't used here directly

// Mock scan data for UI testing if Firestore fails or is empty
export const mockScansData: Scan[] = [
  {
    id: "mock1", userId: "mockUser123", targetUrl: "https://vulnerable-example.com", status: "completed",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 2)), // 2 days ago
    updatedAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 2)),
    aiScanResult: {
      summary: "Mock scan found several critical issues on vulnerable-example.com.",
      vulnerabilities: [
        { type: "SQL Injection", severity: "Critical", description: "Found SQLi point in login form.", affectedUrl: "https://vulnerable-example.com/login" },
        { type: "XSS", severity: "High", description: "Reflected XSS in search parameter.", affectedUrl: "https://vulnerable-example.com/search?q=<script>" },
      ]
    },
    aiSecurityReport: { report: "Mock AI report: 1. Fix SQLi. 2. Sanitize XSS." }
  },
  {
    id: "mock2", userId: "mockUser123", targetUrl: "https://another-site.org", status: "failed",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 1)), // 1 day ago
    updatedAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 1)),
    errorMessage: "Mock Error: Target site was unreachable during scan.",
  },
  {
    id: "mock3", userId: "mockUser123", targetUrl: "https://secure-app.dev", status: "completed",
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date()),
    aiScanResult: { summary: "Mock scan: secure-app.dev appears to be well configured.", vulnerabilities: [] },
  },
    {
    id: "mock4", userId: "mockUser123", targetUrl: "https://api.internal.co", status: "scanning",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 1)), // 1 hour ago
    updatedAt: Timestamp.fromDate(new Date(Date.now() - 3600000 * 1)),
  },
];


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
    case "completed": return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "failed": return <AlertTriangle className="w-4 h-4 text-destructive" />;
    case "scanning": case "generating_report": return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    case "queued": return <Clock className="w-4 h-4 text-muted-foreground" />;  
    default: return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
};


export default function ScanHistoryPage() {
  const { user } = useAuth();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all"); // New filter
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showMockDataMessage, setShowMockDataMessage] = useState(false);


  useEffect(() => {
    if (!user) {
      setLoading(false);
      // If no real user (even mock from context is null), consider showing mock data for UI demo.
      // However, our mock auth context always provides a user.
      // This path might be hit if context somehow fails.
      setScans(mockScansData);
      setShowMockDataMessage(true);
      return;
    }

    setLoading(true);
    const q = query(
        collection(db, "users", user.uid, "scans"), 
        orderBy("createdAt", sortOrder === "desc" ? "desc" : "asc")
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const scansData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Scan));
      if (scansData.length === 0 && !searchTerm && filterStatus === "all" && filterSeverity === "all") { // Only show mock if no filters and no real data
        setScans(mockScansData); 
        setShowMockDataMessage(true);
      } else {
        setScans(scansData);
        setShowMockDataMessage(false);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching scans:", error);
      // On error, fall back to mock data for UI demonstration
      setScans(mockScansData);
      setShowMockDataMessage(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, sortOrder, searchTerm, filterStatus, filterSeverity]); // Added filter dependencies to re-evaluate mock data showing

  const filteredScans = scans
    .filter(scan => 
      scan.targetUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(scan => 
      filterStatus === "all" || scan.status === filterStatus
    )
    .filter(scan => {
      if (filterSeverity === "all" || !scan.aiScanResult?.vulnerabilities) return true;
      return scan.aiScanResult.vulnerabilities.some(v => v.severity.toLowerCase() === filterSeverity.toLowerCase());
    });
  
  const handleExportAllReports = () => {
    // Placeholder for exporting all reports (e.g., as a zip of PDFs or a summary CSV)
    alert("Exporting all reports (placeholder functionality). This would typically generate a batch export.");
  };


  if (loading && scans.length === 0) { // Show skeleton only during initial true loading state and no data yet (even mock)
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Scan History</h1>
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-6">
                <Skeleton className="h-10 flex-1 min-w-[200px]" />
                <Skeleton className="h-10 w-full md:w-[180px]" />
                <Skeleton className="h-10 w-full md:w-[180px]" />
                <Skeleton className="h-10 w-full md:w-[150px]" />
                <Skeleton className="h-10 w-24" />
            </div>
            <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {[1,2,3].map(i => (
                    <Card key={i} className="shadow-lg">
                        <CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-1" /></CardHeader>
                        <CardContent><Skeleton className="h-10 w-full" /><Skeleton className="h-8 w-3/4 mt-2" /></CardContent>
                        <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Scan History</h1>
          <p className="text-muted-foreground">Review your past security scans and their results.</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={handleExportAllReports} variant="outline" disabled={filteredScans.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Export Displayed (PDF)
            </Button>
            <Button asChild>
            <Link href="/dashboard">
                <PlusCircle className="mr-2 h-4 w-4" /> New Scan
            </Link>
            </Button>
        </div>
      </div>
       {showMockDataMessage && (
          <Card className="border-amber-500 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <p className="text-sm text-amber-700">
                  Displaying mock data. Real scan history could not be loaded or is currently empty based on your filters. This is for UI demonstration purposes.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

      <Card className="shadow-md">
        <CardHeader>
            <div className="flex flex-col md:flex-row flex-wrap gap-2 items-center">
                <div className="relative flex-grow w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search by URL or Scan ID..." 
                    className="pl-10" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="scanning">Scanning</SelectItem>
                    <SelectItem value="generating_report">Generating Report</SelectItem>
                    <SelectItem value="queued">Queued</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
                </Select>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Sort by date" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                    <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')} title="Grid View">
                        <LayoutGrid className="h-5 w-5"/>
                    </Button>
                    <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')} title="List View">
                        <ListFilter className="h-5 w-5"/>
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {filteredScans.length > 0 ? (
                viewMode === "grid" ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredScans.map((scan) => (
                    <ScanResultCard key={scan.id} scan={scan} />
                    ))}
                </div>
                ) : ( // List View
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Target URL</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Vulnerabilities</TableHead>
                        <TableHead>Scanned</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredScans.map((scan) => (
                        <TableRow key={scan.id}>
                        <TableCell className="font-medium truncate max-w-xs" title={scan.targetUrl}>{scan.targetUrl}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusBadgeVariant(scan.status)} className="capitalize flex items-center gap-1 text-xs">
                            {getStatusIcon(scan.status)}
                            {scan.status.replace('_', ' ')}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            {scan.aiScanResult?.vulnerabilities?.length ?? 0}
                            {scan.aiScanResult?.vulnerabilities?.find(v => v.severity === 'Critical') && <Badge variant="destructive" className="ml-2 text-xs">Critical</Badge>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(scan.createdAt.toDate(), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                            <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/scans/${scan.id}?targetUrl=${encodeURIComponent(scan.targetUrl)}`}>Details</Link>
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                )
            ) : (
                <div className="text-center py-12">
                <History className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No Scans Found</h3>
                <p className="text-muted-foreground">
                    {scans.length === 0 && !showMockDataMessage && !searchTerm && filterStatus === 'all' && filterSeverity === 'all'
                     ? "You haven't performed any scans yet." 
                     : "No scans match your current filters."}
                </p>
                {scans.length === 0 && !showMockDataMessage && !searchTerm && filterStatus === 'all' && filterSeverity === 'all' && (
                    <Button asChild className="mt-4">
                        <Link href="/dashboard">Start Your First Scan</Link>
                    </Button>
                )}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

    