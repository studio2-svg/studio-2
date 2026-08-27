"use server";

import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreateAdminState = { error?: string; success?: string };
const schema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.email(),
  password: z.string().min(12),
});

export async function createAdministrator(_: CreateAdminState, formData: FormData): Promise<CreateAdminState> {
  const { supabase } = await requireOwner();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Complete every field. The temporary password must be at least 12 characters." };
  const { firstName, lastName, email, password } = parsed.data;
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  });
  if (error || !data.user) return { error: error?.message ?? "The administrator could not be created." };
  const { error: roleError } = await supabase.rpc("set_profile_role", { target_user: data.user.id, new_role: "admin" });
  if (roleError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "The administrator role could not be assigned. No account was kept." };
  }
  return { success: `${email} can now sign in through the admin portal.` };
}
