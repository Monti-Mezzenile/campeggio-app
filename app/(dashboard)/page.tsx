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
    const today = new Date();
    const eventDate = new Date(date);

    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    const difference = eventDate.getTime() - today.getTime();

    return Math.ceil(difference / (1000 * 60 * 60 * 24));
  }

  async function loadData() {
    try {
      console.log("CARICO HOME");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      // 🔴 SE NON C'È SESSIONE: Reindirizza direttamente a /login
      if (!session) {
        setUser(null);
        setCheckingSession(false);
        router.replace("/login");
        return;
      }

      setUser(session.user);

      // Carica Profilo
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      setProfile(profileData);

      // Carica Eventi
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("data_evento", { ascending: true });

      if (eventsError) {
        console.log("ERRORE EVENTI:", eventsError);
      }

      // Carica Partecipazioni
      const { data: membersData } = await supabase
        .from("event_members")
        .select("event_id, stato")
        .eq("user_id", session.user.id);

      const participationMap = Object.fromEntries(
        (membersData || []).map((member) => [member.event_id, member.stato])
      );

      const eventsWithStatus = (eventsData || []).map((event) => ({
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
        const start = new Date(event.data_inizio || event.data_evento);
        const end = new Date(event.data_fine || event.data_inizio || event.data_evento);

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return now >= start && now <= end;
      });

      // 2. EVENTO FUTURO
      if (!selectedEvent) {
        selectedEvent = eventsWithStatus.find((event) => {
          const date = new Date(event.data_inizio || event.data_evento);
          date.setHours(0, 0, 0, 0);

          return date >= now;
        });
      }

      console.log("EVENTO HOME SELEZIONATO:", selectedEvent);

      setNextEvent(selectedEvent || null);

      if (selectedEvent) {
        const date = selectedEvent.data_inizio || selectedEvent.data_evento;
        setDaysLeft(calculateDays(date));
      } else {
        setDaysLeft(null);
      }
    } catch (error) {
      console.log("ERRORE HOME:", error);
    } finally {
      setCheckingSession(false);
    }
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

  // Durante la verifica della sessione o il reindirizzamento
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