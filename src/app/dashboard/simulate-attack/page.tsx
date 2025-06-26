
"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldQuestion, AlertTriangle, CheckCircle, Loader2, BarChart3, FileText, Info } from "lucide-react";
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { simulateAttack, type SimulateAttackOutput } from '@/ai/flows/simulate-attack-flow';

type AttackType = "sqli" | "xss" | "brute-force" | "header-spoofing" | "rate-limiting";
type SimulationResult = SimulateAttackOutput;

const simulationFormSchema = z.object({
  targetUrl: z.string().trim().url({ message: "Please enter a single, valid URL without leading/trailing spaces." }),
  attackType: z.enum(["sqli", "xss", "brute-force", "header-spoofing", "rate-limiting"], {
    required_error: "You need to select an attack type.",
  }),
});

type SimulationFormValues = z.infer<typeof simulationFormSchema>;

export default function SimulateAttackPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [progress, setProgress] = useState(0);

  const form = useForm<SimulationFormValues>({
    resolver: zodResolver(simulationFormSchema),
    defaultValues: {
      targetUrl: "https://example.com",
      attackType: "sqli",
    },
  });

  const attackTypes: { value: AttackType; label: string; description: string }[] = [
    { value: "sqli", label: "SQL Injection", description: "Test for vulnerabilities allowing SQL command execution." },
    { value: "xss", label: "Cross-Site Scripting (XSS)", description: "Check for flaws allowing malicious script injection." },
    { value: "brute-force", label: "Brute-Force Login", description: "Attempt to guess credentials on a login page (simulated)." },
    { value: "header-spoofing", label: "Header Spoofing", description: "Test if the application trusts modifiable HTTP headers." },
    { value: "rate-limiting", label: "Rate Limiting (DoS Simulation)", description: "Lightly test server response under repeated requests." },
  ];

  const onSubmit = async (data: SimulationFormValues) => {
    setIsLoading(true);
    setSimulationResult(null);
    setProgress(0);

    const progressInterval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + Math.floor(Math.random() * 5 + 5)));
    }, 500);

    try {
        const result = await simulateAttack({ targetUrl: data.targetUrl, attackType: data.attackType });
        setSimulationResult(result);
        toast({ title: "Simulation Complete", description: `AI analysis for ${result.attackType} on ${data.targetUrl} finished.`});
    } catch (error: any) {
        console.error("Simulation failed:", error);
        toast({ title: "Simulation Failed", description: error.message || "An unknown error occurred.", variant: "destructive" });
    } finally {
        clearInterval(progressInterval);
        setProgress(100);
        setIsLoading(false);
    }
  };

  const getRiskColor = (level?: "Low" | "Medium" | "High" | "Critical"): string => {
    switch (level) {
      case "Critical": return "bg-red-600";
      case "High": return "bg-orange-500";
      case "Medium": return "bg-yellow-400";
      case "Low": return "bg-green-500";
      default: return "bg-gray-400";
    }
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Simulated Attack Module</h1>
        <p className="text-muted-foreground">
          Safely simulate common attack vectors against your application to identify weaknesses.
          <span className="block text-xs text-amber-600 mt-1"><Info className="inline h-3 w-3 mr-1"/>All simulations are performed by an AI and are non-destructive. No real attacks are launched.</span>
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Configure Simulation</CardTitle>
          <CardDescription>Select an attack type and target URL to begin the AI-powered simulation.</CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="targetUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourapp.com/login" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="attackType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Attack Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an attack type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {attackTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label} - <span className="text-xs text-muted-foreground">{type.description}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldQuestion className="mr-2 h-4 w-4" />}
                    Start AI Simulation
                  </Button>
                </CardFooter>
            </form>
        </Form>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">AI is simulating {attackTypes.find(at => at.value === form.getValues().attackType)?.label} on {form.getValues().targetUrl}...</p>
            <Progress value={progress} className="w-full" />
             <p className="text-xs text-muted-foreground mt-2">This may take a moment.</p>
          </CardContent>
        </Card>
      )}

      {simulationResult && !isLoading && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-primary" />
                        Simulation Results: {simulationResult.attackType}
                    </CardTitle>
                    <CardDescription>Target: {simulationResult.target}</CardDescription>
                </div>
                {simulationResult.riskLevel && (
                    <div className="text-right">
                        <Label className="text-xs text-muted-foreground">Risk Level</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`w-24 h-6 rounded-full flex items-center p-0.5 ${getRiskColor(simulationResult.riskLevel)}`}>
                                <div 
                                    className="h-5 bg-white/30 rounded-full" 
                                    style={{width: `${simulationResult.riskLevel === "Critical" ? 100 : simulationResult.riskLevel === "High" ? 75 : simulationResult.riskLevel === "Medium" ? 50 : 25}%`}}
                                />
                            </div>
                            <span className={`font-semibold text-sm ${
                                simulationResult.riskLevel === "Critical" ? "text-red-600" :
                                simulationResult.riskLevel === "High" ? "text-orange-500" :
                                simulationResult.riskLevel === "Medium" ? "text-yellow-500" : "text-green-600"
                            }`}>{simulationResult.riskLevel}</span>
                        </div>
                    </div>
                )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 rounded-md ${
                simulationResult.status === "success" ? "bg-red-50 border border-red-200" : 
                simulationResult.status === "no_vulnerability" ? "bg-green-50 border border-green-200" : "bg-muted"
            }`}>
              <h3 className="font-semibold flex items-center gap-2">
                {simulationResult.status === "success" && <AlertTriangle className="h-5 w-5 text-red-500" />}
                {simulationResult.status === "no_vulnerability" && <CheckCircle className="h-5 w-5 text-green-500" />}
                Summary: {simulationResult.summary}
              </h3>
            </div>

            {simulationResult.details && simulationResult.details.length > 0 && (
              <div>
                <h4 className="font-semibold mb-1">Details / Hypothetical Findings:</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                  {simulationResult.details.map((detail, index) => <li key={index}>{detail}</li>)}
                </ul>
              </div>
            )}
            {simulationResult.recommendations && simulationResult.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-1">Recommendations:</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                  {simulationResult.recommendations.map((rec, index) => <li key={index}>{rec}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" /> Export Simulation Report (Placeholder)
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
