
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldAlert, FileSearch } from "lucide-react";
import type { ProjectSecurityScan } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface SecurityScansListProps {
    scans: ProjectSecurityScan[];
    isLoading: boolean;
}

const renderSkeletons = () => (
    <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
            <div key={`skeleton-scan-${i}`} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                        <Skeleton className="h-5 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <Skeleton className="h-9 w-32" />
            </div>
        ))}
    </div>
);

export default function SecurityScansList({ scans, isLoading }: SecurityScansListProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Security Scans</CardTitle>
                <CardDescription>Automated security scans performed on this project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {isLoading ? (
                    renderSkeletons()
                ) : scans.length > 0 ? (
                    scans.map(scan => (
                        <div key={scan.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                            <div className="flex items-center gap-4">
                                <ShieldAlert className="h-8 w-8 text-primary"/>
                                <div>
                                    <p className="font-semibold">{scan.scanType} Scan on <span className="font-mono text-primary/80">{scan.target}</span></p>
                                    <div className="text-sm text-muted-foreground">
                                        {scan.status === "COMPLETED" ? (
                                            <>
                                                {scan.criticalCount > 0 && <Badge variant="destructive" className="mr-2">Critical: {scan.criticalCount}</Badge>}
                                                {scan.highCount > 0 && <Badge variant="secondary" className="mr-2 bg-orange-500/80 text-white">High: {scan.highCount}</Badge>}
                                                {scan.criticalCount === 0 && scan.highCount === 0 && <span className="text-green-600">No critical or high vulnerabilities</span>}
                                            </>
                                        ) : (
                                            <Badge variant="secondary">{scan.status}</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" disabled>
                                View Report <ArrowRight className="ml-2 h-4 w-4"/>
                            </Button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                         <FileSearch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                         <h3 className="text-lg font-semibold">No Security Scans Found</h3>
                         <p className="text-sm text-muted-foreground">This project does not have any security scan results yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
