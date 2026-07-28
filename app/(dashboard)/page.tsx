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

      setEvents(eventsWithStatus);

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      let selectedEvent: any = null;

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
      <div className="flex items-center justify-center min-h-[60vh] p-6 text-[#1B2B25] bg-transparent">
        <div className="bg-[#FFF4E3]/80 backdrop-blur-md px-6 py-3 rounded-2xl font-bold shadow-sm border border-[#FFF4E3]/50">
          Caricamento...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full px-5 py-6 space-y-6 bg-transparent overflow-x-hidden">
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

      {/* Lista Eventi */}
      <MyEvents events={events} isAdmin={profile?.ruolo === "admin"} />
    </div>
  );
}