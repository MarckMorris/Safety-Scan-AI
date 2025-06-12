
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Scan } from "@/types";
import ScanResultCard from "@/components/dashboard/ScanResultCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Search, ListFilter, LayoutGrid, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ScanHistoryPage() {
  const { user } = useAuth();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' or 'desc'
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");


  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let q = query(
        collection(db, "users", user.uid, "scans"), 
        orderBy("createdAt", sortOrder === "desc" ? "desc" : "asc")
    );
    
    // This is a client-side filter after fetching. For production, implement server-side filtering if possible.
    // Firestore does not support complex text search or filtering on multiple inequalities on different fields.

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const scansData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Scan));
      setScans(scansData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching scans:", error);
      setLoading(false);
      // Add toast notification for error
    });

    return () => unsubscribe();
  }, [user, sortOrder]);

  const filteredScans = scans
    .filter(scan => 
      scan.targetUrl.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(scan => 
      filterStatus === "all" || scan.status === filterStatus
    );

  if (loading && scans.length === 0) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Scan History</h1>
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {[1,2,3].map(i => (
                    <Card key={i} className="shadow-lg">
                        <CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-1" /></CardHeader>
                        <CardContent><Skeleton className="h-10 w-full" /></CardContent>
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
        <Button asChild>
          <Link href="/dashboard">
            <PlusCircle className="mr-2 h-4 w-4" /> New Scan
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search by URL..." 
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
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}>
                <LayoutGrid className="h-5 w-5"/>
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}>
                <ListFilter className="h-5 w-5"/>
            </Button>
        </div>
      </div>

      {filteredScans.length > 0 ? (
        <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
          {filteredScans.map((scan) => (
            <ScanResultCard key={scan.id} scan={scan} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <History className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No Scans Found</h3>
          <p className="text-muted-foreground">
            {scans.length === 0 ? "You haven't performed any scans yet." : "No scans match your current filters."}
          </p>
          {scans.length === 0 && (
            <Button asChild className="mt-4">
                <Link href="/dashboard">Start Your First Scan</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
