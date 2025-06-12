
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline text-center">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-lg max-w-none dark:prose-invert">
          <p className="text-muted-foreground text-center mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Safety Scan AI (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to all of these Terms, do not use the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Safety Scan AI provides AI-powered vulnerability scanning for websites and mobile applications. The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind.
          </p>

          <h2>3. User Responsibilities</h2>
          <p>
            You are responsible for all activities that occur under your account. You agree to use the Service only for lawful purposes and in accordance with these Terms. You must not use the Service to scan any systems for which you do not have explicit, legal authorization.
          </p>

          <h2>4. Prohibited Uses</h2>
          <p>
            You may not use the Service:
          </p>
          <ul>
            <li>In any way that violates any applicable federal, state, local, or international law or regulation.</li>
            <li>To engage in any activity that interferes with or disrupts the Service.</li>
            <li>To attempt to gain unauthorized access to any systems or networks.</li>
            <li>To scan or test vulnerabilities on systems without proper authorization.</li>
          </ul>

          <h2>5. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are and will remain the exclusive property of Safety Scan AI and its licensors.
          </p>
          
          <h2>6. Limitation of Liability</h2>
          <p>
            In no event shall Safety Scan AI, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>

          <h2>7. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page.
          </p>

          <h2>8. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
