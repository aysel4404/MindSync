const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabaseUrl = process.env.SUPABASE_URL || 'https://rjinsevkivoobatloush.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqaW5zZXZraXZvb2JhdGxvdXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMDAwODIsImV4cCI6MjA5Njc3NjA4Mn0.klrHz28eDNYGd_4Bpev6V8911Dhcr3OzdI-qsiSXLPk';

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Crucial Warning: Supabase credentials are not fully configured!");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    },
    realtime: {
        transport: ws
    }
});

module.exports = supabase;
