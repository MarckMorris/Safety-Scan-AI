
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

const mockBuilds = [
    { id: 'build1', commit: 'a1b2c3d', status: 'SUCCESS', trigger: 'user', timestamp: new Date(Date.now() - 1000 * 60 * 5), logsUrl: '#' },
    { id: 'build2', commit: 'e4f5g6h', status: 'FAILED', trigger: 'webhook', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), logsUrl: '#' },
    { id: 'build3', commit: 'i7j8k9l', status: 'RUNNING', trigger: 'webhook', timestamp: new Date(Date.now() - 1000 * 60 * 1), logsUrl: '#' },
    { id: 'build4', commit: 'm0n1p2q', status: 'SUCCESS', trigger: 'user', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), logsUrl: '#' },
];

type Status = "SUCCESS" | "FAILED" | "RUNNING";

const getStatusInfo = (status: Status) => {
    switch (status) {
        case 'SUCCESS':
            return { icon: <CheckCircle className="text-green-500" />, text: 'Success', variant: 'default' as const };
        case 'FAILED':
            return { icon: <XCircle className="text-destructive" />, text: 'Failed', variant: 'destructive' as const };
        case 'RUNNING':
            return { icon: <Loader2 className="animate-spin text-blue-500" />, text: 'Running', variant: 'secondary' as const };
    }
};

export default function BuildHistoryTable() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Build History</CardTitle>
                <CardDescription>Recent builds from your connected repository. This is mock data.</CardDescription>
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
                        {mockBuilds.map(build => {
                            const statusInfo = getStatusInfo(build.status as Status);
                            return (
                                <TableRow key={build.id}>
                                    <TableCell>
                                        <Badge variant={statusInfo.variant} className="flex items-center gap-1.5 w-fit">
                                            {statusInfo.icon} {statusInfo.text}
                                        </Badge>
                                    </TableCell>
                                    <TableCell><code className="font-mono text-sm">{build.commit}</code></TableCell>
                                    <TableCell className="capitalize">{build.trigger}</TableCell>
                                    <TableCell className="text-muted-foreground">{formatDistanceToNow(build.timestamp, { addSuffix: true })}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" asChild>
                                            <a href={build.logsUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="mr-2 h-4 w-4"/> View
                                            </a>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
