import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Defense in depth: only authenticated owner can request TURN credentials
    if (!user) {
      return NextResponse.json(
        { error: "Acesso não autorizado para credenciais de sinalização." },
        { status: 401 }
      );
    }

    const iceServers: RTCIceServer[] = [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
    ];

    const turnUrls = process.env.TURN_SERVER_URLS;
    const turnSecret = process.env.TURN_SECRET_KEY;
    const turnUser = process.env.TURN_USERNAME;
    const turnCred = process.env.TURN_CREDENTIAL;

    if (turnUrls) {
      const urls = turnUrls.split(",").map((u) => u.trim());

      // If TURN Secret Key is provided, generate short-lived HMAC-SHA1 ephemeral credentials (RFC 5766)
      if (turnSecret) {
        const ttlSeconds = 3600 * 24; // 24 hours
        const expiry = Math.floor(Date.now() / 1000) + ttlSeconds;
        const username = `${expiry}:${user.id.slice(0, 8)}`;
        const hmac = crypto.createHmac("sha1", turnSecret);
        hmac.update(username);
        const credential = hmac.digest("base64");

        iceServers.push({
          urls,
          username,
          credential,
        });
      } else if (turnUser && turnCred) {
        // Static TURN credentials fallback
        iceServers.push({
          urls,
          username: turnUser,
          credential: turnCred,
        });
      }
    }

    return NextResponse.json({ iceServers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao carregar ICE servers.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
