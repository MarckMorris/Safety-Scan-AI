
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Project } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Loader2, Save, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const configSchema = z.object({
  gitProvider: z.enum(["github", "gitlab"], { required_error: "Please select a Git provider." }),
  repoUrl: z.string().url("Please enter a valid repository URL."),
  mainBranch: z.string().min(1, "Branch name is required."),
  workflowPath: z.string().min(1, "Workflow path is required."),
  pat: z.string().min(1, "Personal Access Token is required to save configuration."),
});

type ConfigFormValues = z.infer<typeof configSchema>;

interface ProjectConfigFormProps {
  project: Project;
}

export default function ProjectConfigForm({ project }: ProjectConfigFormProps) {
  const { updateProject } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      gitProvider: project.ciCdConfig?.gitProvider || "github",
      repoUrl: project.ciCdConfig?.repoUrl || "",
      mainBranch: project.ciCdConfig?.mainBranch || "main",
      workflowPath: project.ciCdConfig?.workflowPath || ".github/workflows/main.yml",
      pat: "",
    },
  });

  const onSubmit = async (data: ConfigFormValues) => {
    setIsSubmitting(true);
    try {
      // In a real app, the PAT would be sent to a Cloud Function
      // to be stored securely in Secret Manager, not in Firestore.
      console.log("Submitting to (mocked) Cloud Function:", {
        projectId: project.id,
        ...data,
      });

      // For now, we'll save the non-sensitive parts to Firestore.
      const { pat, ...ciCdConfig } = data;
      await updateProject(project.id, { ciCdConfig });

      toast({
        title: "Configuration Saved (Simulated)",
        description: "Your CI/CD configuration has been updated. The PAT was not stored.",
      });
      form.reset({ ...data, pat: "" }); // Clear PAT field after submission
    } catch (error: any) {
      toast({
        title: "Error Saving Configuration",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CI/CD Configuration</CardTitle>
        <CardDescription>
          Connect your Git repository to enable automated builds, deployments, and scans.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="gitProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Git Provider</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="github">GitHub</SelectItem>
                        <SelectItem value="gitlab">GitLab</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="repoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repository URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/user/repo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mainBranch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Branch</FormLabel>
                    <FormControl>
                      <Input placeholder="main or master" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workflowPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workflow File Path</FormLabel>
                    <FormControl>
                      <Input placeholder=".github/workflows/main.yml" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="pat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Access Token</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter PAT to save changes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Security Warning</AlertTitle>
                <AlertDescription>
                    This is a placeholder. In a real application, a Personal Access Token (PAT) would be sent directly to a secure backend function and never stored in the database.
                </AlertDescription>
            </Alert>
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Save Configuration</>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
