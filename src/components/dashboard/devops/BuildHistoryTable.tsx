
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle, XCircle, Loader2, Clock, History } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import type { Build } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";


interface BuildHistoryTableProps {
  builds: Build[];
  isLoading: boolean;
}

const getStatusInfo = (status: Build["status"]) => {
    switch (status) {
        case 'SUCCESS':
            return { icon: <CheckCircle className="text-green-500" />, text: 'Success', variant: 'default' as const };
        case 'FAILED':
            return { icon: <XCircle className="text-destructive" />, text: 'Failed', variant: 'destructive' as const };
        case 'RUNNING':
            return { icon: <Loader2 className="animate-spin text-blue-500" />, text: 'Running', variant: 'secondary' as const };
        case 'PENDING':
             return { icon: <Clock className="text-muted-foreground" />, text: 'Pending', variant: 'outline' as const };
        default:
             return { icon: <Clock className="text-muted-foreground" />, text: 'Unknown', variant: 'outline' as const };
    }
};

const renderSkeletons = () => (
    [...Array(3)].map((_, i) => (
        <TableRow key={`skeleton-build-${i}`}>
            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
            <TableCell><Skeleton className="h-6 w-32" /></TableCell>
            <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
    ))
);

export default function BuildHistoryTable({ builds, isLoading }: BuildHistoryTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Build History</CardTitle>
                <CardDescription>Recent builds from your connected repository.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Commit</TableHead>
                            <TableHead>Trigger</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Logs</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            renderSkeletons()
                        ) : builds.length > 0 ? (
                            builds.map(build => {
                                const statusInfo = getStatusInfo(build.status);
                                return (
                                    <TableRow key={build.id}>
                                        <TableCell>
                                            <Badge variant={statusInfo.variant} className="flex items-center gap-1.5 w-fit">
                                                {statusInfo.icon} {statusInfo.text}
                                            </Badge>
                                        </TableCell>
                                        <TableCell><code className="font-mono text-sm">{build.commit?.substring(0, 7) || 'N/A'}</code></TableCell>
                                        <TableCell className="capitalize">{build.trigger}</TableCell>
                                        <TableCell className="text-muted-foreground">{formatDistanceToNow(build.timestamp, { addSuffix: true })}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" asChild disabled={!build.logsUrl}>
                                                <a href={build.logsUrl} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="mr-2 h-4 w-4"/> View
                                                </a>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <History className="mx-auto h-8 w-8 text-muted-foreground mb-2"/>
                                    No build history found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
