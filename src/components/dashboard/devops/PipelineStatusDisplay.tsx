
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types";
import { CheckCircle, XCircle, Loader2, Clock, GitBranch } from "lucide-react";

interface PipelineStatusDisplayProps {
  project: Project;
}

type Status = "UNKNOWN" | "SUCCESS" | "FAILED" | "RUNNING" | "PENDING";

const getStatusInfo = (status: Status | undefined) => {
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

export default function PipelineStatusDisplay({ project }: PipelineStatusDisplayProps) {
    const buildStatus = getStatusInfo(project.lastBuildStatus);
    const deploymentStatus = getStatusInfo(project.lastDeploymentStatus);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><GitBranch className="h-6 w-6 text-primary"/>Pipeline Status</CardTitle>
                <CardDescription>Latest build and deployment status from the main branch.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <span className="font-medium">Last Build</span>
                    <Badge variant={buildStatus.variant} className="flex items-center gap-2 text-base px-3 py-1">
                        {buildStatus.icon} {buildStatus.text}
                    </Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <span className="font-medium">Last Deployment</span>
                    <Badge variant={deploymentStatus.variant} className="flex items-center gap-2 text-base px-3 py-1">
                        {deploymentStatus.icon} {deploymentStatus.text}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}
