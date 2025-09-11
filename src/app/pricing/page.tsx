
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

const pricingPlans = [
  {
    name: "Starter",
    price: "$0",
    period: "/month",
    description: "Perfect for individuals and small personal projects.",
    features: [
      "Basic URL scanning",
      "Limited vulnerability checks (Top 3 OWASP)",
      "1 scan report per month",
      "Community support"
    ],
    cta: "Get Started",
    href: "/auth/register?plan=starter"
  },
  {
    name: "Professional",
    price: "$49",
    period: "/month",
    description: "Ideal for freelancers, developers, and small businesses.",
    features: [
      "Unlimited URL scans",
      "Comprehensive vulnerability checks (Full OWASP Top 10)",
      "AI-driven patch suggestions",
      "Detailed PDF reports",
      "Email & Chat support",
      "Scan history up to 1 year"
    ],
    cta: "Choose Pro",
    href: "/auth/register?plan=pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Tailored for large organizations needing advanced security and compliance.",
    features: [
      "All Professional features",
      "Mobile application API scanning",
      "GitHub & CI/CD integration",
      "Simulated attack engine access",
      "Dedicated account manager",
      "Custom SLAs & On-premise options",
      "Security team training"
    ],
    cta: "Contact Sales",
    href: "/contact"
  },
];

export default function PricingPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">
          Flexible Pricing for Every Need
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Choose a plan that scales with your security requirements. All plans come with our core AI scanning technology.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {pricingPlans.map((plan) => (
          <Card 
            key={plan.name} 
            className={`flex flex-col shadow-xl hover:scale-105 transition-transform duration-300 ${plan.popular ? 'border-2 border-primary ring-4 ring-primary/30' : 'border-border'}`}
          >
            <CardHeader className="text-center pb-4">
              {plan.popular && (
                <div className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Most Popular</div>
              )}
              <CardTitle className="text-3xl font-bold font-headline">{plan.name}</CardTitle>
              <p className="text-4xl font-extrabold my-3">
                {plan.price}
                {plan.period && <span className="text-base font-normal text-muted-foreground">{plan.period}</span>}
              </p>
              <CardDescription className="text-sm min-h-[40px]">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow pt-0">
              <ul className="space-y-3 my-6">
                {plan.features.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button 
                className="w-full text-lg py-6" 
                variant={plan.popular ? "default" : "outline"} 
                asChild
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center mt-16 p-8 bg-secondary/50 rounded-lg">
        <h3 className="text-2xl font-semibold mb-3">Not Sure Which Plan is Right for You?</h3>
        <p className="text-muted-foreground mb-6">
          Our team is here to help. Get in touch for a personalized consultation or to discuss custom enterprise solutions.
        </p>
        <Button size="lg" asChild>
          <Link href="/contact">Contact Us</Link>
        </Button>
      </div>
    </div>
  );
}
