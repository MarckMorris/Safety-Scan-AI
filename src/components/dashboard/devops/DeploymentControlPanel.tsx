
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types";
import { PlayCircle, SkipForward, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeploymentControlPanelProps {
  project: Project;
}

export default function DeploymentControlPanel({ project }: DeploymentControlPanelProps) {
    const { toast } = useToast();

    const handleAction = (action: string) => {
        toast({
            title: `Action: ${action} (Placeholder)`,
            description: `This would trigger the '${action}' action for project '${project.name}'.`,
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Deployment Controls</CardTitle>
                <CardDescription>Manually trigger pipeline actions. Use with caution.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
                <Button onClick={() => handleAction('Trigger Build')} disabled={!project.ciCdConfig?.repoUrl}>
                    <PlayCircle className="mr-2 h-4 w-4" /> Trigger Build
                </Button>
                <Button variant="outline" onClick={() => handleAction('Promote Canary')} disabled>
                    <SkipForward className="mr-2 h-4 w-4" /> Promote Canary (Coming Soon)
                </Button>
                <Button variant="destructive" onClick={() => handleAction('Rollback Deployment')} disabled>
                    <RotateCcw className="mr-2 h-4 w-4" /> Rollback Deployment (Coming Soon)
                </Button>
            </CardContent>
        </Card>
    );
}
