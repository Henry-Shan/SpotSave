import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
        opacity: 0.3,
      }} />

      <div className="text-center relative z-10 max-w-4xl mx-auto">
        <div className="mb-6 flex justify-center">
          <Zap className="w-20 h-20 text-primary animate-pulse" />
        </div>
        <h1 className="text-6xl font-bold bg-gradient-accent bg-clip-text text-transparent mb-6 leading-tight">
          FormFiller AI
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Automated Google Form submission system for Rice University students. 
          Schedule forms to be filled automatically at specific times.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="neon" 
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-lg px-8"
          >
            Get Started
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-lg px-8"
          >
            Login
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="backdrop-blur-xl bg-card/50 border border-primary/20 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-2 text-primary">🎓 Rice Exclusive</h3>
            <p className="text-sm text-muted-foreground">
              Only @rice.edu emails accepted
            </p>
          </div>
          <div className="backdrop-blur-xl bg-card/50 border border-primary/20 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-2 text-primary">⏰ Scheduled Filling</h3>
            <p className="text-sm text-muted-foreground">
              Set exact times for form submissions
            </p>
          </div>
          <div className="backdrop-blur-xl bg-card/50 border border-primary/20 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-2 text-primary">🤖 AI Powered</h3>
            <p className="text-sm text-muted-foreground">
              Intelligent form filling with GPT
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
