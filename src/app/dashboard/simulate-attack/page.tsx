
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldQuestion, AlertTriangle, CheckCircle, Loader2, BarChart3, FileText, Info } from "lucide-react";
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

type AttackType = "sqli" | "xss" | "brute-force" | "header-spoofing" | "rate-limiting";

interface SimulationResult {
  attackType: string;
  target: string;
  status: "success" | "failed" | "error" | "no_vulnerability";
  summary: string;
  details?: string[]; // Specific findings or exposed areas
  recommendations?: string[];
  riskLevel?: "Low" | "Medium" | "High" | "Critical"; // For risk gauge
}

export default function SimulateAttackPage() {
  const { toast } = useToast();
  const [targetUrl, setTargetUrl] = useState("https://example.com"); // Default or last used
  const [attackType, setAttackType] = useState<AttackType>("sqli");
  const [isLoading, setIsLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [progress, setProgress] = useState(0);

  const attackTypes: { value: AttackType; label: string; description: string }[] = [
    { value: "sqli", label: "SQL Injection", description: "Test for vulnerabilities allowing SQL command execution." },
    { value: "xss", label: "Cross-Site Scripting (XSS)", description: "Check for flaws allowing malicious script injection." },
    { value: "brute-force", label: "Brute-Force Login", description: "Attempt to guess credentials on a login page (simulated)." },
    { value: "header-spoofing", label: "Header Spoofing", description: "Test if the application trusts modifiable HTTP headers." },
    { value: "rate-limiting", label: "Rate Limiting (DoS Simulation)", description: "Lightly test server response under repeated requests." },
  ];

  const handleSimulateAttack = async () => {
    if (!targetUrl) {
      toast({ title: "Target URL Required", description: "Please enter a URL to simulate an attack on.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setSimulationResult(null);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 90 ? 90 : prev + 10));
    }, 300);
    
    // Simulate API call to backend for actual simulation
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
    clearInterval(interval);
    setProgress(100);

    // Mock result based on attack type for demonstration
    let mockResult: SimulationResult;
    const isVulnerable = Math.random() > 0.5; // 50% chance of finding a vulnerability

    switch (attackType) {
      case "sqli":
        mockResult = {
          attackType: "SQL Injection", target: targetUrl,
          status: isVulnerable ? "success" : "no_vulnerability",
          summary: isVulnerable ? `Potential SQL Injection point found at ${targetUrl}/login.` : `No direct SQL Injection vectors identified during basic check.`,
          details: isVulnerable ? ["Parameter 'username' seems injectable.", "Error-based SQLi pattern observed."] : ["Standard input sanitization appears to be in place for tested forms."],
          recommendations: isVulnerable ? ["Implement parameterized queries.", "Use an ORM.", "Validate all user inputs strictly."] : ["Continue using prepared statements and ORM.", "Regularly review code for new injection points."],
          riskLevel: isVulnerable ? "Critical" : "Low",
        };
        break;
      case "xss":
        mockResult = {
          attackType: "Cross-Site Scripting", target: targetUrl,
          status: isVulnerable ? "success" : "no_vulnerability",
          summary: isVulnerable ? `Reflected XSS possible via query parameter 'search'.` : `No obvious XSS vulnerabilities found in common inputs.`,
          details: isVulnerable ? ["Payload `<script>alert(1)</script>` executed in page context."] : ["Content Security Policy (CSP) seems to be active.", "Outputs appear to be encoded."],
          recommendations: isVulnerable ? ["Implement robust output encoding (e.g., OWASP ESAPI).", "Use a strong Content Security Policy."] : ["Maintain and update CSP.", "Sanitize user inputs where they are reflected."],
          riskLevel: isVulnerable ? "High" : "Low",
        };
        break;
      default:
        mockResult = {
          attackType: attackTypes.find(at => at.value === attackType)?.label || "Unknown Attack", target: targetUrl,
          status: isVulnerable ? "success" : "no_vulnerability",
          summary: isVulnerable ? `Simulation indicates potential weakness to ${attackType}.` : `Basic simulation for ${attackType} did not reveal immediate issues.`,
          details: isVulnerable ? ["Specific simulated payloads were successful (details omitted for mock)."] : ["Standard defenses against this attack type seem present."],
          recommendations: isVulnerable ? ["Review specific controls for this attack vector.", "Conduct deeper penetration testing."] : ["Continue security best practices.", "Monitor for new attack patterns."],
          riskLevel: isVulnerable ? "Medium" : "Low",
        };
    }
    
    setSimulationResult(mockResult);
    setIsLoading(false);
    toast({ title: "Simulation Complete (Mock)", description: `Mock simulation for ${mockResult.attackType} on ${targetUrl} finished.`});
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
          <span className="block text-xs text-amber-600 mt-1"><Info className="inline h-3 w-3 mr-1"/>All simulations are high-level and non-destructive for demonstration.</span>
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Configure Simulation</CardTitle>
          <CardDescription>Select an attack type and target URL to begin the simulation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="targetUrl">Target URL</Label>
            <Input 
              id="targetUrl" 
              placeholder="https://yourapp.com/login" 
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attackType">Attack Type</Label>
            <Select 
              value={attackType} 
              onValueChange={(value) => setAttackType(value as AttackType)}
              disabled={isLoading}
            >
              <SelectTrigger id="attackType">
                <SelectValue placeholder="Select an attack type" />
              </SelectTrigger>
              <SelectContent>
                {attackTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label} - <span className="text-xs text-muted-foreground">{type.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSimulateAttack} disabled={isLoading} className="w-full md:w-auto">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldQuestion className="mr-2 h-4 w-4" />}
            Start Simulation (Mock)
          </Button>
        </CardFooter>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">Simulating {attackTypes.find(at => at.value === attackType)?.label} on {targetUrl}...</p>
            <Progress value={progress} className="w-full" />
             <p className="text-xs text-muted-foreground mt-2">This is a mock simulation and may take a few moments.</p>
          </P>
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
                <h4 className="font-semibold mb-1">Details / Exposed Areas:</h4>
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
