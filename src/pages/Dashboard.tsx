import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus, Trash2, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type FormSubmission = Database["public"]["Tables"]["form_submissions"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [formUrl, setFormUrl] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (!profileData || !profileData.full_name) {
        navigate("/onboarding");
        return;
      }

      setProfile(profileData);
      loadSubmissions();
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadSubmissions = async () => {
    const { data, error } = await supabase
      .from("form_submissions")
      .select("*")
      .order("scheduled_time", { ascending: false });

    if (!error && data) {
      setSubmissions(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAddSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const { error } = await supabase
        .from("form_submissions")
        .insert({
          user_id: session.user.id,
          form_url: formUrl,
          scheduled_time: scheduledTime,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Form scheduled!",
        description: "Your form will be filled automatically at the scheduled time.",
      });

      setFormUrl("");
      setScheduledTime("");
      loadSubmissions();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule form",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("form_submissions")
      .delete()
      .eq("id", id);

    if (!error) {
      toast({ title: "Submission deleted" });
      loadSubmissions();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
        opacity: 0.2,
      }} />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              FormFiller Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              {profile.full_name} • {profile.college} • {profile.year}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Add Form Section */}
        <Card className="backdrop-blur-xl bg-card/50 border-primary/20 p-6 mb-8 shadow-neon">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Schedule New Form
          </h2>
          <form onSubmit={handleAddSubmission} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="formUrl">Google Form URL</Label>
              <Input
                id="formUrl"
                type="url"
                placeholder="https://docs.google.com/forms/d/e/..."
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                required
                className="bg-background/50 border-primary/30 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledTime">Scheduled Time</Label>
              <Input
                id="scheduledTime"
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
                className="bg-background/50 border-primary/30 focus:border-primary"
              />
            </div>
            <Button type="submit" variant="neon" disabled={loading}>
              {loading ? "Scheduling..." : "Schedule Form"}
            </Button>
          </form>
        </Card>

        {/* Submissions List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Scheduled Forms</h2>
          {submissions.length === 0 ? (
            <Card className="backdrop-blur-xl bg-card/50 border-primary/20 p-8 text-center">
              <p className="text-muted-foreground">No forms scheduled yet</p>
            </Card>
          ) : (
            submissions.map((submission) => (
              <Card
                key={submission.id}
                className="backdrop-blur-xl bg-card/50 border-primary/20 p-4 hover:border-primary/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(submission.status)}
                      <span className="text-sm font-medium capitalize">{submission.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-1">
                      {submission.form_url}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Scheduled: {new Date(submission.scheduled_time).toLocaleString()}
                    </p>
                    {submission.error_message && (
                      <p className="text-xs text-destructive mt-1">{submission.error_message}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(submission.id)}
                    className="text-destructive hover:text-destructive/90"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Info Card */}
        <Card className="backdrop-blur-xl bg-card/50 border-primary/20 p-6 mt-8">
          <h3 className="font-semibold mb-2">🤖 How it works</h3>
          <p className="text-sm text-muted-foreground">
            This system coordinates with an external Python service that uses Selenium to automatically
            fill Google Forms at your scheduled times. Make sure your Python backend is running and
            properly configured to handle the automation requests.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
