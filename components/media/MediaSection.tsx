"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import MediaUpload from "@/components/media/MediaUpload";
import MediaGrid from "@/components/media/MediaGrid";

export default function MediaSection({ eventId }: { eventId: string }) {
  const [user, setUser] = useState<any>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
    setLoading(false);
  }

  useEffect(() => {
    loadUser();
  }, []);

  function reload() {
    setReloadKey((value) => value + 1);
  }

  if (loading) {
    return (
      <p className="text-center py-8 text-xs font-bold text-slate-400 animate-pulse">
        Caricamento media...
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 🚀 Sezione Upload */}
      {user && (
        <MediaUpload eventId={eventId} userId={user.id} reload={reload} />
      )}

      {/* 📸 Griglia Media con Modal Fullscreen integrato */}
      <MediaGrid eventId={eventId} reloadKey={reloadKey} />
    </div>
  );
}