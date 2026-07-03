import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  normalizeUsername,
  validateEmail,
  validatePassword,
} from "@/lib/auth-validation";

/**
 * POST /api/auth/signup
 *
 * Creates a Supabase auth user + the matching public `users` profile row using
 * the service-role client. The client then signs in with the browser client to
 * establish the cookie session.
 *
 * Body: { email, username, password }
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, username, password } = (body ?? {}) as Record<string, unknown>;

  const emailCheck = validateEmail(email);
  if ("error" in emailCheck)
    return NextResponse.json({ error: emailCheck.error }, { status: 400 });

  const usernameCheck = normalizeUsername(username);
  if ("error" in usernameCheck)
    return NextResponse.json({ error: usernameCheck.error }, { status: 400 });

  const passwordCheck = validatePassword(password);
  if ("error" in passwordCheck)
    return NextResponse.json({ error: passwordCheck.error }, { status: 400 });

  const admin = getAdminSupabase();

  // Enforce unique usernames up front for a friendlier error.
  const { data: existing } = await admin
    .from("users")
    .select("id")
    .eq("username", usernameCheck.value)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: emailCheck.value,
      password: passwordCheck.value,
      email_confirm: true,
      user_metadata: { username: usernameCheck.value },
    });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Could not create account" },
      { status: 400 },
    );
  }

  // A database trigger auto-creates the matching `users` row (using the
  // username from user_metadata) as soon as the auth user is inserted. So we
  // update that row to guarantee the username is set, rather than insert a
  // duplicate (which would collide on the primary key).
  const { error: profileError } = await admin
    .from("users")
    .update({ username: usernameCheck.value })
    .eq("id", created.user.id);

  if (profileError) {
    // Roll back the orphaned auth user so the email/username can be retried.
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: "Could not create profile. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { user: { id: created.user.id, email: emailCheck.value, username: usernameCheck.value } },
    { status: 201 },
  );
}
