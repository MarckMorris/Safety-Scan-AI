
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ShieldCheck, DatabaseBackup } from "lucide-react";

export default function SecurityPage() {
  const securityPractices = [
    {
      icon: <Lock className="w-8 h-8 text-primary" />,
      title: "Data Encryption",
      description: "All sensitive data, both in transit and at rest, is encrypted using industry-standard encryption protocols like TLS/SSL and AES-256."
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-primary" />,
      title: "Secure Authentication",
      description: "We utilize Firebase Authentication, which provides robust and secure user management, including multi-factor authentication options."
    },
    {
      icon: <DatabaseBackup className="w-8 h-8 text-primary" />,
      title: "Regular Security Audits",
      description: "Our systems undergo regular internal and third-party security audits to identify and address potential vulnerabilities."
    },
    {
      title: "Firebase Security Rules",
      description: "We leverage Firebase Security Rules for fine-grained access control to our Firestore database and Cloud Storage, ensuring data is only accessible by authorized users."
    },
    {
      title: "Input Sanitization & Validation",
      description: "All user inputs are rigorously sanitized and validated to prevent common web vulnerabilities such as XSS and SQL injection (within our own platform)."
    },
    {
      title: "Responsible Disclosure",
      description: "We encourage responsible disclosure of security vulnerabilities. If you believe you have found a security issue, please contact us at security@safetyscan.ai."
    }
  ];

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">Our Commitment to Security</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          At Safety Scan AI, the security of your data and our platform is our top priority. We employ a multi-layered approach to protect your information and ensure the integrity of our services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {securityPractices.map((practice, index) => (
          <Card key={index} className="shadow-lg">
            <CardHeader className="items-center text-center">
              {practice.icon && <div className="mb-3">{practice.icon}</div>}
              <CardTitle className="text-xl font-semibold">{practice.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">{practice.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-12 shadow-xl bg-secondary/30">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline text-center">Reporting Security Issues</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4 text-muted-foreground">
            If you believe you have discovered a security vulnerability in Safety Scan AI, please let us know by emailing <a href="mailto:security@safetyscan.ai" className="text-primary hover:underline font-medium">security@safetyscan.ai</a>. We appreciate your efforts to disclose your findings responsibly.
          </p>
          <p className="text-xs text-muted-foreground">
            Please do not use our services to scan systems you do not have explicit permission to test.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
