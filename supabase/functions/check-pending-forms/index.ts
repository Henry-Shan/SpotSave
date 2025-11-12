import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get pending forms that should be processed
    const now = new Date().toISOString();
    const { data: pendingForms, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_time', now);

    if (error) throw error;

    console.log(`Found ${pendingForms?.length || 0} pending forms to process`);

    // This endpoint would be called by your Python service or a cron job
    // It returns the list of forms that need to be filled
    
    // You can also update the status to 'processing' here
    if (pendingForms && pendingForms.length > 0) {
      const formIds = pendingForms.map(f => f.id);
      await supabase
        .from('form_submissions')
        .update({ status: 'processing' })
        .in('id', formIds);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        pendingForms: pendingForms || [],
        count: pendingForms?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error checking pending forms:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
