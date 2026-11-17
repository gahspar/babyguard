import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId } = body;

    if (!deviceId) {
      return NextResponse.json(
        { error: "Identificador do dispositivo não informado." },
        { status: 400 }
      );
    }

    // Revoke device in database
    const { error: revokeErr } = await supabase
      .from("devices")
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
      })
      .eq("id", deviceId)
      .eq("user_id", user.id);

    if (revokeErr) throw revokeErr;

    // End any active streaming sessions associated with this device
    await supabase
      .from("monitoring_sessions")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .or(`station_device_id.eq.${deviceId},monitor_device_id.eq.${deviceId}`);

    // Audit log
    await supabase.from("connection_events").insert({
      user_id: user.id,
      device_id: deviceId,
      event_type: "device_revoked",
      metadata: {
        revokedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Dispositivo revogado com sucesso.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao revogar dispositivo.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
