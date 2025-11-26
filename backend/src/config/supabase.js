require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Create a single supabase client for interacting with your database
let supabase;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.warn('Supabase credentials not found. Using mock client.');
    supabase = {
        from: () => ({
            insert: () => Promise.resolve({ error: null }),
            select: () => Promise.resolve({ data: [], error: null }),
            update: () => Promise.resolve({ error: null }),
        }),
        storage: {
            from: () => ({
                upload: () => Promise.resolve({ data: {}, error: null }),
            })
        }
    };
}

module.exports = supabase;
