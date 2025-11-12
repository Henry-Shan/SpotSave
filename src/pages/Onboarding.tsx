import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const COLLEGES = [
  "Baker College",
  "Will Rice College",
  "Hanszen College",
  "Wiess College",
  "Jones College",
  "Brown College",
  "Lovett College",
  "Sid Richardson College",
  "Martel College",
  "McMurtry College",
  "Duncan College",
];

const YEARS = ["Freshman", "Sophomore", "Junior", "Senior"];

const Onboarding = () => {
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile && profile.full_name && profile.college && profile.year) {
        navigate("/dashboard");
      } else {
        setCheckingProfile(false);
      }
    };

    checkProfile();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session found");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          college,
          year,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      toast({
        title: "Profile completed!",
        description: "Welcome to SpotSave",
      });

      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
        opacity: 0.3,
      }} />

      <div className="w-full max-w-md relative z-10">
        <div className="backdrop-blur-xl bg-card/50 border border-primary/20 rounded-2xl p-8 shadow-neon">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Complete Your Profile
            </h1>
            <p className="text-muted-foreground">Tell us about yourself</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-background/50 border-primary/30 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="college">College</Label>
              <Select value={college} onValueChange={setCollege} required>
                <SelectTrigger className="bg-background/50 border-primary/30 focus:border-primary">
                  <SelectValue placeholder="Select your college" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/30">
                  {COLLEGES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select value={year} onValueChange={setYear} required>
                <SelectTrigger className="bg-background/50 border-primary/30 focus:border-primary">
                  <SelectValue placeholder="Select your year" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/30">
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              variant="neon"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Saving..." : "Continue"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
