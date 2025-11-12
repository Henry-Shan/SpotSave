import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Zap,
  Calendar as CalendarIcon,
  Link as LinkIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Session } from "@supabase/supabase-js";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [formUrl, setFormUrl] = useState("");
  const [scheduledTime, setScheduledTime] = useState<Date | undefined>(
    new Date()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleScheduleForm = async () => {
    if (!formUrl || !scheduledTime) {
      toast({
        title: "Missing Information",
        description: "Please enter both form URL and schedule time",
        variant: "destructive",
      });
      return;
    }

    if (!session) {
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("form_submissions")
        .insert({
          user_id: session.user.id,
          form_url: formUrl,
          scheduled_time: scheduledTime.toISOString(),
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Form Scheduled!",
        description: "Your form has been scheduled successfully",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error scheduling form:", error);
      toast({
        title: "Error",
        description: "Failed to schedule form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateSelect = (day: Date | undefined) => {
    if (!day) return;
    const newDateTime = scheduledTime ? new Date(scheduledTime) : new Date();
    newDateTime.setFullYear(day.getFullYear());
    newDateTime.setMonth(day.getMonth());
    newDateTime.setDate(day.getDate());
    setScheduledTime(newDateTime);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
        opacity: 0.3,
      }} />
      
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-primary/30 rounded-full blur-2xl animate-pulse" />
      </div>

      <div className="text-center relative z-10 max-w-4xl mx-auto">
        {/* ... (header JSX) ... */}
        <div className="mb-6 flex justify-center">
          <Zap className="w-20 h-20 text-primary animate-pulse" />
        </div>
        <h1 className="text-6xl font-bold bg-gradient-accent bg-clip-text text-transparent mb-6 leading-tight">
          SpotSave
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Schedule your sign-up. Guarantee your spot.
        </p>

        <div className="backdrop-blur-xl bg-card/80 border border-primary/30 rounded-2xl p-8 mb-8 max-w-2xl mx-auto w-full">
          <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-accent bg-clip-text text-transparent">
            New Party Coming Up?
          </h2>
          
          {/* --- MODIFIED FORM STRUCTURE --- */}
          <div className="space-y-6"> {/* Increased spacing between groups */}
            
            {/* Group 1: Party Link */}
            <div className="space-y-2 text-left">
              <Label htmlFor="form-url" className="text-base font-medium">
                Party Link
              </Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="form-url"
                  type="url"
                  placeholder="https://docs.google.com/forms/"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="pl-10 bg-background/50 border-primary/20"
                />
              </div>
            </div>
            
            {/* Group 2: Release Time */}
            <div className="space-y-2 text-left">
              <Label htmlFor="release-time-trigger" className="text-base font-medium">
                Schedule Time
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="release-time-trigger"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal pl-10 relative bg-background/50 border-primary/20 hover:text-primary",
                      !scheduledTime && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
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
                    <p className="text-sm font-medium mb-2">Time</p>
                    <Input
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

            {/* Group 3: Submit Button */}
           
            <Button 
              variant="neon" 
              size="lg"
              onClick={handleScheduleForm}
              disabled={isSubmitting}
              className="w-full text-lg"
            >
              {isSubmitting ? "Scheduling..." : "Schedule Form"}
            </Button>
          </div>
        </div>

        {!session && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8"
            >
              Login / Sign Up
            </Button>
          </div>
        )}

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