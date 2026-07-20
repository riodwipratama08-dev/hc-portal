import { createClient } from "@/lib/supabase/server";

export async function logAudit(
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, any> | null = null,
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: actor } = await supabase
      .from("employees").select("id").eq("email", user.email).single();

    if (!actor) return;

    await supabase.from("audit_logs").insert({
      actor_id: actor.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
  } catch {
    // silently fail — audit logging should never break the main action
  }
}
