import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimiter } from "@/lib/security/rate-limiter";
import { hashPairingCode, isPairingCodeExpired } from "@/lib/security/pairing-crypto";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local";
    const rateCheck = rateLimiter.check(`pair:${ip}`, 5, 15 * 60 * 1000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Muitas tentativas incorretas. Bloqueado por ${Math.ceil(
            rateCheck.resetInMs / 60000
          )} minutos para proteção contra força bruta.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { code, deviceName, deviceType, fingerprint } = body;

    if (!code || !deviceName || !deviceType || !fingerprint) {
      return NextResponse.json(
        { error: "Dados de pareamento incompletos." },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Você precisa estar autenticado como proprietário para vincular o dispositivo." },
        { status: 401 }
      );
    }

    const codeHash = await hashPairingCode(code.trim(), user.id);

    // Look for matching unexpired pairing code
    const { data: pairingRecord, error: searchErr } = await supabase
      .from("pairing_codes")
      .select("*")
      .eq("user_id", user.id)
      .eq("code_hash", codeHash)
      .is("used_at", null)
      .eq("is_revoked", false)
      .single();

    if (searchErr || !pairingRecord) {
      return NextResponse.json(
        {
          error: "Código de pareamento inválido ou já utilizado.",
          remainingAttempts: rateCheck.remaining,
        },
        { status: 403 }
      );
    }

    if (isPairingCodeExpired(pairingRecord.expires_at)) {
      return NextResponse.json(
        { error: "Este código de pareamento expirou. Gere um novo código no painel." },
        { status: 410 }
      );
    }

    // Mark pairing code as used
    await supabase
      .from("pairing_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", pairingRecord.id);

    // Register authorized device
    const { data: newDevice, error: deviceErr } = await supabase
      .from("devices")
      .upsert(
        {
          user_id: user.id,
          name: deviceName.trim(),
          type: deviceType,
          device_fingerprint: fingerprint,
          is_active: true,
          revoked_at: null,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "user_id,device_fingerprint" }
      )
      .select()
      .single();

    if (deviceErr) {
      throw deviceErr;
    }

    // Log connection audit event
    await supabase.from("connection_events").insert({
      user_id: user.id,
      device_id: newDevice.id,
      event_type: "device_registered",
      metadata: {
        deviceName,
        deviceType,
        pairedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Dispositivo pareado com sucesso!",
      device: newDevice,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao processar pareamento.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
