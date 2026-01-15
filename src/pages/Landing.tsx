import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Clock, FolderKanban, Zap, Brain, Target, Briefcase, ArrowRight, Check
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function Landing() {
  const navigate = useNavigate();

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.5 }
  };

  const benefits = [
    { icon: <Clock className="w-5 h-5" />, text: "Save hours every week" },
    { icon: <FolderKanban className="w-5 h-5" />, text: "Organize projects, ideas, and finances" },
    { icon: <Zap className="w-5 h-5" />, text: "Automate repetitive tasks" },
    { icon: <Brain className="w-5 h-5" />, text: "Make faster, better decisions" },
    { icon: <Target className="w-5 h-5" />, text: "Stay focused and in control" },
    { icon: <Briefcase className="w-5 h-5" />, text: "Look more professional" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header - Minimal */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="font-bold text-lg">Architecta</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button size="sm" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
              Run your business faster, smarter, and with less stress.
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              All your planning, organization, and automation in one simple platform.
            </p>

            <Button 
              size="lg" 
              onClick={() => navigate("/auth")} 
              className="text-base px-8 h-12"
            >
              Start your free access
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* VALUE PROPOSITION */}
      <section className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">
              What this system helps you do
            </h2>

            <div className="grid gap-4">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4 bg-background rounded-lg p-4 border border-border/50"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {benefit.icon}
                  </div>
                  <span className="text-base md:text-lg font-medium">{benefit.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Built for people who want clarity and results
            </h2>

            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Whether you run a business, manage projects, work as a freelancer, or just want a better system to organize your life, this platform helps you stay productive, focused, and in control.
            </p>
          </motion.div>
        </div>
      </section>

      {/* WHY IT WORKS */}
      <section className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              One system. Total clarity.
            </h2>

            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Instead of using multiple tools, notes, and spreadsheets, you get one organized workspace to plan, track, and execute everything in your business or personal projects.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-bold mb-8">
              Start using the system today
            </h2>

            <Button 
              size="lg" 
              onClick={() => navigate("/auth")} 
              className="text-base px-10 h-12"
            >
              Try it now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo className="w-5 h-5" />
              <span className="text-sm text-muted-foreground">Architecta</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Architecta. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
