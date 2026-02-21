const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function createBucket() {
    const { data, error } = await supabase.storage.createBucket('instruments', {
        public: true,
        allowedMimeTypes: ['image/png'],
        fileSizeLimit: 1048576
    });
    if (error) console.log('Error creating bucket:', error.message);
    else console.log('Bucket created:', data);
}
createBucket();
