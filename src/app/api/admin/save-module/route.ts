import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function PUT(request: NextRequest) {
  try {
    // Verify admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { moduleId, data } = body;

    const admin = await createAdminClient();

    const { error } = await admin
      .from("modules")
      .update({
        title_pt: data.title_pt,
        title_en: data.title_en,
        description_pt: data.description_pt,
        description_en: data.description_en,
        content_pt: data.content_pt,
        content_en: data.content_en,
        video_url: data.video_url || null,
        order_index: data.order_index,
        is_published: data.is_published,
      })
      .eq("id", moduleId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save module error:", error);
    return NextResponse.json(
      { error: "Failed to save module" },
      { status: 500 },
    );
  }
}
