"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import PreparationMonti from "@/components/home/PreparationMonti";
import Header from "@/components/home/Header";
import NextEventCard from "@/components/home/NextEventCard";
import MyStuff from "@/components/home/MyStuff";
import MyEvents from "@/components/home/MyEvents";
import CommunitySection from "@/components/home/CommunitySection";

// 🎯 Helper per parsare stringhe "YYYY-MM-DD" senza problemi di Fuso Orario / UTC
function parseLocalDate(dateStr: string | null) {
  if (!dateStr) return null;
  const cleanStr = dateStr.split("T")[0];
  const parts = cleanStr.split("-").map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return new Date(dateStr);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function calculateDays(dateStr: string) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventDate = parseLocalDate(dateStr);
  if (!eventDate) return null;
  eventDate.setHours(0, 0, 0, 0);

  const difference = eventDate.getTime() - today.getTime();
  const days = Math.ceil(difference / (1000 * 60 * 60 * 24));
  return days < 0 ? 0 : days;
}

export default function Home() {
  const router = useRouter();

  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  async function loadData() {
    try {
      setCheckingSession(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setUser(null);
        setCheckingSession(false);
        router.replace("/login");
        return;
      }

      setUser(session.user);
      const userId = session.user.id;

      const [profileRes, eventsRes, membersRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("events").select("*"),
        supabase
          .from("event_members")
          .select("event_id, stato")
          .eq("user_id", userId),
      ]);

      if (profileRes.error) {
        console.error("ERRORE PROFILO:", profileRes.error);
      }
      setProfile(profileRes.data || null);

      if (eventsRes.error) {
        console.error("ERRORE EVENTI:", eventsRes.error);
      }

      const eventsData = eventsRes.data || [];
      const membersData = membersRes.data || [];

      const participationMap = Object.fromEntries(
        membersData.map((member) => [member.event_id, member.stato])
      );

      const eventsWithStatus = eventsData.map((event) => ({
        ...event,
        participation: participationMap[event.id] || null,
        joined: participationMap[event.id] === "partecipo",
      }));

      // 🎯 FIX 1: ORDINAMENTO MANUALE RIGOROSO PER DATA INIZIO / DATA EVENTO (CRESCENTE)
      const sortedEvents = [...eventsWithStatus].sort((a, b) => {
        const dateA = parseLocalDate(a.data_inizio || a.data_evento)?.getTime() || 0;
        const dateB = parseLocalDate(b.data_inizio || b.data_evento)?.getTime() || 0;
        return dateA - dateB;
      });

      setEvents(sortedEvents);

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // 🎯 FIX 2: Cerca prima un evento IN CORSO oggi
      let selectedEvent: any = sortedEvents.find((event) => {
        const startDateStr = event.data_inizio || event.data_evento;
        const endDateStr = event.data_fine || startDateStr;

        if (!startDateStr) return false;

        const start = parseLocalDate(startDateStr);
        const end = parseLocalDate(endDateStr);

        if (!start || !end) return false;

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return now >= start && now <= end;
      });

      // 🎯 FIX 3: Se nessun evento è in corso, prendi il PRIMO evento futuro (ovvero il più vicino a oggi)
      if (!selectedEvent) {
        selectedEvent = sortedEvents.find((event) => {
          const dateStr = event.data_inizio || event.data_evento;
          if (!dateStr) return false;

          const date = parseLocalDate(dateStr);
          if (!date) return false;
          date.setHours(0, 0, 0, 0);

          return date >= now;
        });
      }

      setNextEvent(selectedEvent || null);

      if (selectedEvent) {
        const date = selectedEvent.data_inizio || selectedEvent.data_evento;
        setDaysLeft(calculateDays(date));
      } else {
        setDaysLeft(null);
      }
    } catch (error) {
      console.error("ERRORE HOME:", error);
    } finally {
      setCheckingSession(false);
    }
  }

  useEffect(() => {
    loadData();

    function refreshHome() {
      loadData();
    }

    window.addEventListener("focus", refreshHome);

    return () => {
      window.removeEventListener("focus", refreshHome);
    };
  }, []);

  if (checkingSession || !user) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] w-full p-6 text-[#1B2B25] bg-[#0d1b1e]">
        <div className="bg-[#FFF4E3]/80 backdrop-blur-md px-6 py-3 rounded-2xl font-bold shadow-sm border border-[#FFF4E3]/50">
          Caricamento...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[100dvh] bg-transparent px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] space-y-6 overflow-x-hidden">
      {/* Header con salutino */}
      <Header name={profile?.nome} />

      {/* Card prossimo evento */}
      <NextEventCard event={nextEvent} daysLeft={daysLeft} />

      {/* PreparationMonti */}
      {nextEvent && nextEvent.joined && (
        <section className="my-5">
          <PreparationMonti eventId={nextEvent.id} userId={user.id} />
        </section>
      )}

      {/* Le mie cose */}
      <MyStuff />

      {/* 🪪 Community - Rastrelliera Tesserini */}
      <CommunitySection />

      {/* Lista Eventi */}
      <MyEvents events={events} isAdmin={profile?.ruolo === "admin"} />
    </div>
  );
}