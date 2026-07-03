const { createClient } = require('@supabase/supabase-js');
require ('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

function normalizeSupabaseUrl(url) {
    return url.replace(/\/rest\/v1\/?$/, '');
}

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
        'Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in backend/api/.env before starting the API.'
    );
}

if (supabaseServiceKey.startsWith('sb_publishable_')) {
    console.warn('SUPABASE_SERVICE_KEY looks like a publishable key. Auth admin routes require a service_role key.');
}

const supabase = createClient(normalizeSupabaseUrl(supabaseUrl), supabaseServiceKey);
module.exports = supabase;