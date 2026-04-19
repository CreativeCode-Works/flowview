"use server";

import { createClient } from "@/lib/supabase/server";

export async function joinWaitlist(
  _prevState: { success: boolean; error: string | null },
  formData: FormData
): Promise<{ success: boolean; error: string | null }> {
  const email = formData.get("email");

  if (!email || typeof email !== "string") {
    return { success: false, error: "Email is required." };
  }

  const trimmed = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { success: false, error: "Please enter a valid email." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("waitlist")
    .insert({ email: trimmed });

  if (error) {
    if (error.code === "23505") {
      return { success: true, error: null }; // already on waitlist, treat as success
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }

  return { success: true, error: null };
}
