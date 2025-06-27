
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldAlert } from "lucide-react";

const mockScans = [
    { id: 'scan1', type: 'DAST', status: 'COMPLETED', vulnerabilities: { critical: 1, high: 3 }, target: 'https://example.com/login', timestamp: new Date() },
    { id: 'scan2', type: 'SAST', status: 'COMPLETED', vulnerabilities: { critical: 0, high: 1 }, target: 'main branch', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    { id: 'scan3', type: 'SCA', status: 'COMPLETED', vulnerabilities: { critical: 0, high: 0 }, target: 'package-lock.json', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48) },
];

export default function SecurityScansList() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Security Scans</CardTitle>
                <CardDescription>Automated security scans performed on this project. This is mock data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {mockScans.map(scan => (
                    <div key={scan.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-4">
                            <ShieldAlert className="h-8 w-8 text-primary"/>
                            <div>
                                <p className="font-semibold">{scan.type} Scan on <span className="font-mono text-primary/80">{scan.target}</span></p>
                                <div className="text-sm text-muted-foreground">
                                    {scan.vulnerabilities.critical > 0 && <Badge variant="destructive" className="mr-2">Critical: {scan.vulnerabilities.critical}</Badge>}
                                    {scan.vulnerabilities.high > 0 && <Badge variant="secondary" className="mr-2 bg-orange-500/80 text-white">High: {scan.vulnerabilities.high}</Badge>}
                                    {scan.vulnerabilities.critical === 0 && scan.vulnerabilities.high === 0 && <span className="text-green-600">No critical or high vulnerabilities</span>}
                                </div>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                            View Report <ArrowRight className="ml-2 h-4 w-4"/>
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
