import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");
  const user = searchParams.get("user") || "";
  const pass = searchParams.get("pass") || "";

  if (!targetUrl) {
    return new NextResponse("URL parameter is required", { status: 400 });
  }

  try {
    const headers: HeadersInit = {
      "User-Agent": "BabyGuard-Proxy/1.0",
      Accept: "*/*",
    };

    if (user && pass) {
      headers["Authorization"] = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
    }

    const response = await fetch(targetUrl, {
      headers,
      cache: "no-store",
    });

    if (!response.ok && response.status !== 200) {
      return new NextResponse(`Camera server returned status ${response.status}`, {
        status: response.status,
      });
    }

    const contentType =
      response.headers.get("content-type") ||
      "multipart/x-mixed-replace; boundary=--BoundaryString";

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error connecting to camera stream";
    return new NextResponse(msg, { status: 502 });
  }
}
