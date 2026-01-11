#!/usr/bin/env node
// backend/scripts/seed-test-user.js
// Creates a test user in Supabase Auth + profiles table

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const TEST_USERS = [
  {
    email: 'employee@test.com',
    password: 'password123',
    profile: {
      first_name: 'Jean',
      last_name: 'Dupont',
      role: 'employee',
      weekly_hours_target: 35
    }
  },
  {
    email: 'manager@test.com',
    password: 'password123',
    profile: {
      first_name: 'Marie',
      last_name: 'Martin',
      role: 'manager',
      weekly_hours_target: 40
    }
  }
];

async function seedTestUsers() {
  console.log('🌱 Seeding test users...\n');

  for (const user of TEST_USERS) {
    try {
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true // Auto-confirm email
      });

      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log(`⚠️  ${user.email} already exists, skipping auth creation`);

          // Get existing user ID
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = users.find(u => u.email === user.email);

          if (existingUser) {
            // Update profile anyway
            await upsertProfile(existingUser.id, user);
          }
          continue;
        }
        throw authError;
      }

      console.log(`✅ Created auth user: ${user.email} (ID: ${authData.user.id})`);

      // 2. Create profile in profiles table
      await upsertProfile(authData.user.id, user);

    } catch (error) {
      console.error(`❌ Error creating ${user.email}:`, error.message);
    }
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('Test credentials:');
  console.log('─────────────────────────────────────');
  TEST_USERS.forEach(u => {
    console.log(`  Email:    ${u.email}`);
    console.log(`  Password: ${u.password}`);
    console.log(`  Role:     ${u.profile.role}`);
    console.log('─────────────────────────────────────');
  });
}

async function upsertProfile(userId, user) {
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      email: user.email,
      ...user.profile
    });

  if (profileError) {
    console.error(`❌ Error creating profile for ${user.email}:`, profileError.message);
  } else {
    console.log(`✅ Created profile: ${user.profile.first_name} ${user.profile.last_name} (${user.profile.role})`);
  }
}

seedTestUsers().catch(console.error);
