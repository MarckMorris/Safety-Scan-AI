
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Project, Build, ProjectSecurityScan } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GitBranch, Loader2, AlertCircle, FolderSymlink, History } from "lucide-react";
import ProjectConfigForm from "@/components/dashboard/devops/ProjectConfigForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PipelineStatusDisplay from "@/components/dashboard/devops/PipelineStatusDisplay";
import DeploymentControlPanel from "@/components/dashboard/devops/DeploymentControlPanel";
import BuildHistoryTable from "@/components/dashboard/devops/BuildHistoryTable";
import SecurityScansList from "@/components/dashboard/devops/SecurityScansList";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { user, projects, loading: authLoading } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [securityScans, setSecurityScans] = useState<ProjectSecurityScan[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    const foundProject = projects.find(p => p.id === projectId);
    if (foundProject) {
      setProject(foundProject);
    }
  }, [projectId, projects, authLoading]);

  useEffect(() => {
    if (!user || !projectId) return;

    setDataLoading(true);

    const buildsRef = collection(db, 'users', user.uid, 'projects', projectId, 'builds');
    const buildsQuery = query(buildsRef, orderBy('timestamp', 'desc'));
    const unsubscribeBuilds = onSnapshot(buildsQuery, (snapshot) => {
        const fetchedBuilds = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate(),
        }) as Build);
        setBuilds(fetchedBuilds);
    }, (err) => {
        console.error("Error fetching builds:", err);
    });

    const scansRef = collection(db, 'users', user.uid, 'projects', projectId, 'security_scans');
    const scansQuery = query(scansRef, orderBy('createdAt', 'desc'));
    const unsubscribeScans = onSnapshot(scansQuery, (snapshot) => {
         const fetchedScans = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
            finishedAt: doc.data().finishedAt?.toDate(),
        }) as ProjectSecurityScan);
        setSecurityScans(fetchedScans);
        // Assuming data loads together
        if (dataLoading) setDataLoading(false);
    }, (err) => {
        console.error("Error fetching security scans:", err);
        if (dataLoading) setDataLoading(false);
    });

    return () => {
        unsubscribeBuilds();
        unsubscribeScans();
    };
  }, [user, projectId]);


  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading project details...</p>
      </div>
    );
  }

  if (!project && !authLoading) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Project Not Found</h2>
        <p className="text-muted-foreground mb-6">The project (ID: {projectId}) could not be loaded or does not exist.</p>
        <Button onClick={() => router.push('/dashboard/projects')}>Go to Projects</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>
        <div className="flex items-center gap-4 border-b pb-4">
          <GitBranch className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">{project?.name}</h1>
            <p className="text-muted-foreground">{project?.description || "No description provided."}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pipeline">CI/CD Pipeline</TabsTrigger>
          <TabsTrigger value="security">Security Scans</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pipeline" className="mt-6 space-y-6">
          {project && (
            <>
              <PipelineStatusDisplay project={project} />
              <DeploymentControlPanel project={project} />
            </>
          )}
            <BuildHistoryTable builds={builds} isLoading={dataLoading} />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
            <SecurityScansList scans={securityScans} isLoading={dataLoading}/>
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          {project && <ProjectConfigForm project={project} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
