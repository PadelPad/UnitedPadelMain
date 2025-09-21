import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://rodhevjnrxiveaacyqwm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZGhldmpucnhpdmVhYWN5cXdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDgyNDQ1OSwiZXhwIjoyMDYwNDAwNDU5fQ.uQiDNcL1TWkdNQecUFqr49Kg16R1k7HWneonRF0yhs4'
);

async function createUser(email, password) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error('Error creating user:', error.message);
  } else {
    console.log('User created with ID:', data.user.id);
  }
}

createUser('testuser5@example.com', 'Password123!');