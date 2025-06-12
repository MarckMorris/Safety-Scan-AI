
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <ShieldAlert className="h-6 w-6 text-primary" />
            <span className="font-semibold font-headline">Safety Scan AI</span>
          </div>
          <nav className="flex flex-wrap justify-center md:justify-end space-x-4 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-foreground">Contact Us</Link>
            <Link href="/security" className="hover:text-foreground">Security</Link>
          </nav>
        </div>
        <div className="text-center text-sm text-muted-foreground mt-6">
          © {new Date().getFullYear()} Safety Scan AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
