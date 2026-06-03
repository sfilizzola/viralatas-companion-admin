import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Verify caller JWT
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: { user: callerUser }, error: callerErr } = await callerClient.auth.getUser()

  if (callerErr || !callerUser) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Verify caller is godlike
  const { data: callerProfile, error: callerProfileErr } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', callerUser.id)
    .single()

  if (callerProfileErr || !callerProfile || callerProfile.role !== 'godlike') {
    return new Response(JSON.stringify({ error: 'Caller is not godlike' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Parse request body
  let userId: string | undefined
  try {
    const body = await req.json()
    userId = body.userId
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Missing userId' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Verify target is not godlike
  const { data: targetProfile, error: targetProfileErr } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (targetProfileErr) {
    return new Response(JSON.stringify({ error: 'Target user not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (targetProfile.role === 'godlike') {
    return new Response(JSON.stringify({ error: 'Cannot delete godlike user' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Delete from auth.users — cascades to public.users via FK
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
