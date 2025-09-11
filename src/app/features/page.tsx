
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";
import Image from "next/image";

export default function FeaturesPage() {
  const featuresList = [
    "AI-Powered Vulnerability Scanning",
    "OWASP Top 10 Detection",
    "SQL Injection Point Analysis",
    "Exposed API Scanning",
    "Insecure HTTP Header Checks",
    "Outdated Dependency Evaluation",
    "User-Friendly Result Display (JSON & Natural Language)",
    "Severity Classification (Low, Medium, High, Critical)",
    "Scan Log Storage in Firestore",
    "Simulated Attack Engine (SQLi, XSS, Brute-force, DoS)",
    "AI Patch Suggestion Engine",
    "Security Improvement Reports",
    "Best Practices & Recommendations",
    "Scan History Dashboard",
    "CI/CD and Webhook Integrations (GitHub)",
    "Secure Firebase Authentication",
    "Role-Based Access Control",
    "User Profile Management",
  ];

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">
          Features of <span className="text-primary">Safety Scan AI</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Explore the comprehensive suite of tools and capabilities our platform offers to keep your applications secure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {featuresList.map((feature, index) => (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold">
                <CheckSquare className="w-6 h-6 text-primary mr-3 shrink-0" />
                {feature}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Detailed description for &quot;{feature}&quot; will be available soon. Our platform ensures top-notch security through this advanced feature.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center mt-16">
        <Image 
            src="https://picsum.photos/seed/features/800/400" 
            alt="Feature highlight" 
            width={800}
            height={400}
            className="mx-auto rounded-lg shadow-xl"
            data-ai-hint="technology abstract"
        />
      </div>
    </div>
  );
}
