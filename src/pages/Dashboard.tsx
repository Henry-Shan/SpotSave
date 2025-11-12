import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut,
  PlusCircle, // Changed icon for a cleaner look
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  LayoutGrid, // Added for empty state
  Calendar as CalendarIcon, // Added for date picker
} from "lucide-react";
import { format } from "date-fns"; // Added
import { Calendar } from "@/components/ui/calendar"; // Added
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // Added
import { cn } from "@/lib/utils"; // Added
import type { Database } from "@/integrations/supabase/types";

type FormSubmission = Database["public"]["Tables"]["form_submissions"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [formUrl, setFormUrl] = useState("");
  // --- Updated State ---
  const [scheduledTime, setScheduledTime] = useState<Date | undefined>(
    new Date()
  );
  // ---
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
      .order("created_at", { ascending: false }); // Ordered by creation time

    if (!error && data) {
      setSubmissions(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // --- Updated Handler ---
  const handleAddSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUrl || !scheduledTime) {
      toast({
        title: "Missing Information",
        description: "Please enter both form URL and schedule time",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const { error } = await supabase
        .from("form_submissions")
        .insert({
          user_id: session.user.id,
          form_url: formUrl,
          scheduled_time: scheduledTime.toISOString(), // Convert Date to ISO string
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Form scheduled!",
        description: "Your form will be filled automatically at the scheduled time.",
      });

      setFormUrl("");
      setScheduledTime(new Date()); // Reset to current time
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
  // ---

  // --- Added Helper ---
  const handleDateSelect = (day: Date | undefined) => {
    if (!day) return;
    const newDateTime = scheduledTime ? new Date(scheduledTime) : new Date();
    newDateTime.setFullYear(day.getFullYear());
    newDateTime.setMonth(day.getMonth());
    newDateTime.setDate(day.getDate());
    setScheduledTime(newDateTime);
  };
  // ---

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
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Get user's first name
  const firstName = profile.full_name?.split(' ')[0] || "User";

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 relative overflow-hidden">
      {/* ... (Background elements) ... */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
        opacity: 0.2,
      }} />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* === Redesigned Header === */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              Welcome Back, {firstName}!
            </h1>
            <p className="text-muted-foreground mt-1">
              {profile.college} • {profile.year}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="self-start sm:self-center">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </header>

        {/* === Redesigned Layout (2-column) === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- Main Column: Submissions List --- */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Scheduled Forms</h2>
            {submissions.length === 0 ? (
              <Card className="backdrop-blur-xl bg-card/50 border-primary/20 p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                <LayoutGrid className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No forms scheduled yet.</p>
                <p className="text-sm text-muted-foreground/80">Use the panel on the right to add one.</p>
              </Card>
            ) : (
              submissions.map((submission) => (
                <Card
                  key={submission.id}
                  className="backdrop-blur-xl bg-card/50 border-primary/20 p-4 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(submission.status)}
                        <span className="text-sm font-medium capitalize">{submission.status}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-1" title={submission.form_url}>
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
                      className="text-destructive hover:text-destructive/90 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* --- Sidebar: Add Form --- */}
          <div className="lg:col-span-1">
            <Card className="backdrop-blur-xl bg-card/50 border-primary/20 p-6 shadow-neon sticky top-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-primary" />
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
                
                {/* --- Upgraded Date/Time Picker --- */}
                <div className="space-y-2">
                  <Label htmlFor="scheduledTime">Scheduled Time</Label>
                   <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal relative bg-background/50 border-primary/30 hover:text-primary",
                          !scheduledTime && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 w-4 h-4" />
                        {scheduledTime ? (
                          format(scheduledTime, "PPP 'at' p")
                        ) : (
                          <span>Pick a date and time</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={scheduledTime}
                        onSelect={handleDateSelect}
                        initialFocus
                        classNames={{
                          day_today: "bg-transparent",
                        }}
                      />
                      <div className="p-4 border-t border-border">
                        <Label htmlFor="timeInput" className="text-sm font-medium mb-2">Time</Label>
                        <Input
                          id="timeInput"
                          type="time"
                          className="bg-background"
                          value={scheduledTime ? format(scheduledTime, "HH:mm") : "00:00"}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':').map(Number);
                            const newDateTime = scheduledTime ? new Date(scheduledTime) : new Date();
                            newDateTime.setHours(hours);
                            newDateTime.setMinutes(minutes);
                            setScheduledTime(newDateTime);
                          }}
                        />
                         <p className="text-xs text-muted-foreground mt-2">
                          Please set the time in <strong>Houston (CST)</strong>.
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* --- End Upgraded Picker --- */}
                
                <Button type="submit" variant="neon" disabled={loading} className="w-full">
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {loading ? "Scheduling..." : "Schedule Form"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;