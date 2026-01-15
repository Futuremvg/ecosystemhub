import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Logo className="w-8 h-8" />
            <span className="font-bold text-lg">Architecta</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using Architecta, you agree to be bound by these Terms of Service 
              and all applicable laws and regulations. If you do not agree with any of these terms, 
              you are prohibited from using or accessing this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Use License</h2>
            <p className="text-muted-foreground">
              Permission is granted to temporarily access and use Architecta for personal or 
              business purposes, subject to the restrictions outlined in these terms. This license 
              does not include the right to modify, copy, or distribute our software.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Account Responsibilities</h2>
            <p className="text-muted-foreground">
              You are responsible for maintaining the confidentiality of your account and password. 
              You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Subscription and Payments</h2>
            <p className="text-muted-foreground">
              Paid subscriptions are billed in advance on a recurring basis. You may cancel your 
              subscription at any time, and cancellation will take effect at the end of the current 
              billing period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              Architecta shall not be liable for any indirect, incidental, special, consequential, 
              or punitive damages resulting from your use of or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify or replace these terms at any time. We will provide 
              notice of any material changes by posting the new terms on this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Contact</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms of Service, please contact us at 
              legal@architecta.com.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
