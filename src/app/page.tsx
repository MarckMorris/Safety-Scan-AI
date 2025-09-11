
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ShieldCheck, ListChecks, DatabaseZap, Network, FileLock2, PackageSearch, BrainCircuit } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const features = [
  {
    icon: <ListChecks className="w-10 h-10 text-primary" />,
    title: "OWASP Top 10",
    description: "Comprehensive scanning for the most critical web application security risks.",
  },
  {
    icon: <DatabaseZap className="w-10 h-10 text-primary" />,
    title: "SQL Injection Detection",
    description: "Identify and mitigate SQL injection vulnerabilities in your applications.",
  },
  {
    icon: <Network className="w-10 h-10 text-primary" />,
    title: "API Security Analysis",
    description: "Scan for exposed or unprotected APIs to prevent data breaches.",
  },
  {
    icon: <FileLock2 className="w-10 h-10 text-primary" />,
    title: "Insecure HTTP Headers",
    description: "Check for missing or misconfigured security headers.",
  },
  {
    icon: <PackageSearch className="w-10 h-10 text-primary" />,
    title: "Dependency Vulnerabilities",
    description: "Evaluate outdated or vulnerable dependencies in your codebase.",
  },
  {
    icon: <BrainCircuit className="w-10 h-10 text-primary" />,
    title: "AI-Powered Recommendations",
    description: "Get actionable, AI-driven insights and remediation advice.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Basic scanning for personal projects.",
    features: ["1 URL scan/month", "Limited vulnerability checks", "Basic reporting"],
    cta: "Get Started Free",
    href: "/auth/register"
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "Advanced scanning for professionals and small teams.",
    features: ["Unlimited URL scans", "Full vulnerability checks", "AI recommendations", "Detailed PDF reports", "Email support"],
    cta: "Choose Pro",
    href: "/auth/register?plan=pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Tailored solutions for large organizations.",
    features: ["All Pro features", "Mobile app scanning", "GitHub integration", "CI/CD webhooks", "Dedicated support", "SLA"],
    cta: "Contact Sales",
    href: "/contact"
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-32 bg-card text-card-foreground">
        <div className="container mx-auto text-center px-4 md:px-6">
          <ShieldCheck className="w-24 h-24 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight mb-6">
            Secure Your Digital World with <span className="text-primary">Safety Scan AI</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Leverage advanced AI to proactively identify and remediate security vulnerabilities in your websites and applications.
          </p>
          <Button size="lg" asChild className="font-semibold text-lg px-8 py-6">
            <Link href="/dashboard">Scan Your App Now</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-16 md:py-24 bg-card text-card-foreground">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-4">Powerful Security Features</h2>
          <p className="text-center text-muted-foreground mb-12 md:text-lg max-w-2xl mx-auto">
            Our AI-driven platform provides comprehensive scanning and actionable insights to keep you secure.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="flex flex-col text-center items-center shadow-lg hover:shadow-xl transition-shadow duration-300 bg-secondary/30">
                <CardHeader>
                  {feature.icon}
                  <CardTitle className="mt-4 font-headline">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Demo Section */}
      <section className="w-full py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-4">See Safety Scan AI in Action</h2>
          <p className="text-center text-muted-foreground mb-12 md:text-lg max-w-2xl mx-auto">
            Visualize how our platform scans your application and presents clear, actionable results.
          </p>
          <div className="bg-card p-4 sm:p-6 md:p-8 rounded-xl shadow-2xl overflow-hidden">
            <Image
              src="https://picsum.photos/seed/dashboard/1200/600"
              alt="Safety Scan AI Demo"
              width={1200}
              height={600}
              className="rounded-lg object-cover"
              data-ai-hint="dashboard security"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full py-16 md:py-24 bg-card text-card-foreground">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-4">Simple, Transparent Pricing</h2>
          <p className="text-center text-muted-foreground mb-12 md:text-lg max-w-2xl mx-auto">
            Choose the plan that best fits your security needs.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {pricingPlans.map((plan) => (
              <Card key={plan.name} className={`flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 bg-secondary/30 ${plan.popular ? 'border-2 border-primary ring-2 ring-primary/50' : ''}`}>
                <CardHeader className="text-center">
                  {plan.popular && <div className="text-xs text-primary font-semibold mb-2 uppercase">Most Popular</div>}
                  <CardTitle className="text-2xl font-headline">{plan.name}</CardTitle>
                  <p className="text-4xl font-bold">
                    {plan.price}
                    {plan.period && <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>}
                  </p>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {plan.features.map((item, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full py-16 md:py-24 bg-background">
        <div className="container mx-auto text-center px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-headline font-bold mb-6">Ready to Enhance Your Security?</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Join thousands of developers and businesses who trust Safety Scan AI to protect their digital assets.
          </p>
          <Button size="lg" asChild className="font-semibold text-lg px-8 py-6">
            <Link href="/auth/register">Get Started Today</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
