"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import PreparationMonti from "@/components/home/PreparationMonti";
import Header from "@/components/home/Header";
import NextEventCard from "@/components/home/NextEventCard";
import MyStuff from "@/components/home/MyStuff";
import MyEvents from "@/components/home/MyEvents";

export default function Home() {
  const router = useRouter();

  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  function calculateDays(date: string) {
    if (!date) return null;
    const today = new Date();
    const eventDate = new Date(date);

    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    const difference = eventDate.getTime() - today.getTime();
    return Math.ceil(difference / (1000 * 60 * 60 * 24));
  }

  async function loadData() {
    try {
      setCheckingSession(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      // 🔴 SE NON C'È SESSIONE: Reindirizza a /login
      if (!session) {
        setUser(null);
        setCheckingSession(false);
        router.replace("/login");
        return;
      }

      setUser(session.user);
      const userId = session.user.id;

      // ⚡ CARICAMENTO PARALLELO (Profilo, Eventi e Partecipazioni)
      const [profileRes, eventsRes, membersRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("events")
          .select("*")
          .order("data_evento", { ascending: true }),
        supabase
          .from("event_members")
          .select("event_id, stato")
          .eq("user_id", userId),
      ]);

      if (profileRes.error) {
        console.error("ERRORE PROFILO:", profileRes.error);
      }
      setProfile(profileRes.data || null);

      if (eventsError(eventsRes.error)) {
        console.error("ERRORE EVENTI:", eventsRes.error);
      }

      const eventsData = eventsRes.data || [];
      const membersData = membersRes.data || [];

      // Mappa dello stato partecipazioni
      const participationMap = Object.fromEntries(
        membersData.map((member) => [member.event_id, member.stato])
      );

      const eventsWithStatus = eventsData.map((event) => ({
        ...event,
        participation: participationMap[event.id] || null,
        joined: participationMap[event.id] === "partecipo",
      }));

      setEvents(eventsWithStatus);

      // Calcola Evento Home (in corso o futuro)
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      let selectedEvent: any = null;

      // 1. EVENTO IN CORSO
      selectedEvent = eventsWithStatus.find((event) => {
        const startDateStr = event.data_inizio || event.data_evento;
        const endDateStr = event.data_fine || startDateStr;

        if (!startDateStr) return false;

        const start = new Date(startDateStr);
        const end = new Date(endDateStr);

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return now >= start && now <= end;
      });

      // 2. EVENTO FUTURO
      if (!selectedEvent) {
        selectedEvent = eventsWithStatus.find((event) => {
          const dateStr = event.data_inizio || event.data_evento;
          if (!dateStr) return false;

          const date = new Date(dateStr);
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

  function eventsError(error: any) {
    if (error) console.log("ERRORE EVENTI:", error);
    return false;
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    function refreshHome() {
      loadData();
    }

    window.addEventListener("focus", refreshHome);

    return () => {
      window.removeEventListener("focus", refreshHome);
    };
  }, []);

  // Durante la verifica della sessione
  if (checkingSession || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-neutral-400">
        Caricamento...
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 pb-28">
      <Header name={profile?.nome} />

      <NextEventCard event={nextEvent} daysLeft={daysLeft} />

      {nextEvent && (
        <PreparationMonti eventId={nextEvent.id} userId={user.id} />
      )}

      <MyStuff />

      <MyEvents events={events} isAdmin={profile?.ruolo === "admin"} />
    </main>
  );
}