
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GitBranch, PlusCircle, Loader2, FolderGit2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

const newProjectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters."),
  description: z.string().optional(),
});

type NewProjectValues = z.infer<typeof newProjectSchema>;

export default function DevOpsProjectsPage() {
  const { projects, loading, addProject } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<NewProjectValues>({
    resolver: zodResolver(newProjectSchema),
  });

  const onSubmit = async (data: NewProjectValues) => {
    setIsSubmitting(true);
    try {
      const newProjectId = await addProject(data.name, data.description || "");
      toast({
        title: "Project Created",
        description: `Project "${data.name}" has been successfully created.`,
      });
      form.reset({ name: "", description: "" });
      setOpen(false);
      router.push(`/dashboard/projects/${newProjectId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to create project: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSkeletons = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center">
            <GitBranch className="mr-3 h-8 w-8 text-primary" />
            DevOps Projects
          </h1>
          <p className="text-muted-foreground">
            Configure, monitor, and manage your CI/CD pipelines and security scans.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Give your new project a name to get started. You can configure it later.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input id="name" {...form.register("name")} placeholder="My Awesome App" />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input id="description" {...form.register("description")} placeholder="A short description of the project." />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Project
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Projects</CardTitle>
          <CardDescription>Select a project to view its details and manage its configuration.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            renderSkeletons()
          ) : projects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link href={`/dashboard/projects/${project.id}`} key={project.id} className="block">
                  <Card className="hover:shadow-lg hover:border-primary/50 transition-all h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FolderGit2 className="h-5 w-5 text-primary"/>
                        <span className="truncate">{project.name}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                        {project.description || "No description provided."}
                      </p>
                       <p className="text-xs text-muted-foreground mt-4">
                        Last updated: {project.updatedAt ? formatDistanceToNow(project.updatedAt, { addSuffix: true }) : 'just now'}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <FolderGit2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Projects Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first project.</p>
              <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}>Create Project</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
