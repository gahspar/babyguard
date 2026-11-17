import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Nav } from "@/components/layout/nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth: if middleware somehow fails, layout enforces protection
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-night-950 text-slate-100 flex flex-col pb-20 sm:pb-6">
      <Header userEmail={user.email} />
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
