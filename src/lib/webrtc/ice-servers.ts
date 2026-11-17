export const DEFAULT_STUN_SERVERS: RTCIceServer[] = [
  {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
      "stun:stun2.l.google.com:19302",
      "stun:stun3.l.google.com:19302",
      "stun:stun4.l.google.com:19302",
    ],
  },
];

export async function fetchIceServers(): Promise<RTCIceServer[]> {
  try {
    const res = await fetch("/api/webrtc/turn");
    if (!res.ok) {
      return DEFAULT_STUN_SERVERS;
    }
    const data = await res.json();
    return data.iceServers && data.iceServers.length > 0
      ? data.iceServers
      : DEFAULT_STUN_SERVERS;
  } catch (err) {
    console.warn("Falha ao buscar TURN via API, utilizando STUN padrão:", err);
    return DEFAULT_STUN_SERVERS;
  }
}
