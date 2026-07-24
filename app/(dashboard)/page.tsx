"use client";


import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import PreparationMonti from "@/components/home/PreparationMonti";
import Header from "@/components/home/Header";
import NextEventCard from "@/components/home/NextEventCard";
import MyStuff from "@/components/home/MyStuff";
import MyEvents from "@/components/home/MyEvents";
import Curiosity from "@/components/home/Curiosity";



export default function Home(){


  const [checkingSession,setCheckingSession] = useState(true);


  const [user,setUser] = useState<any>(null);


  const [profile,setProfile] = useState<any>(null);


  const [events,setEvents] = useState<any[]>([]);


  const [daysLeft,setDaysLeft] = useState<number | null>(null);





  function calculateDays(date:string){


    const today = new Date();


    const eventDate = new Date(date);



    today.setHours(0,0,0,0);


    eventDate.setHours(0,0,0,0);




    const difference =

      eventDate.getTime()

      -

      today.getTime();




    return Math.ceil(

      difference /

      (1000 * 60 * 60 * 24)

    );


  }
    async function loadData(){


    try{


      console.log("INIZIO LOAD DATA");



      const {

        data:{
          session

        },

        error:sessionError

      } = await supabase.auth.getSession();





      console.log(
        "SESSIONE:",
        session
      );





      if(sessionError){

        console.log(
          "ERRORE SESSIONE:",
          sessionError
        );

      }






      if(!session){


        setUser(null);

        setCheckingSession(false);

        return;


      }







      setUser(session.user);







      const {

        data:profileData,

        error:profileError

      } = await supabase

        .from("profiles")

        .select("*")

        .eq(

          "id",

          session.user.id

        )

        .maybeSingle();






      console.log(

        "PROFILO:",
        profileData,
        profileError

      );






      setProfile(profileData);







      const {

        data:eventsData,

        error:eventsError

      } = await supabase

        .from("events")

        .select("*")

        .order(

          "data_evento",

          {

            ascending:true

          }

        );






      console.log(

        "EVENTI:",
        eventsData,
        eventsError

      );






      if(eventsError){

        console.log(

          "ERRORE EVENTI:",
          eventsError

        );

      }






      const {

        data:membersData,

        error:membersError

      } = await supabase

        .from("event_members")

        .select(

          "event_id, stato"

        )

        .eq(

          "user_id",

          session.user.id

        );






      console.log(

        "MEMBRI:",
        membersData,
        membersError

      );






      const participationMap = Object.fromEntries(



        (membersData || []).map(member=>[



          member.event_id,



          member.stato



        ])



      );






      const eventsWithStatus = (eventsData || [])

        .map(event=>({



          ...event,



          participation:

            participationMap[event.id] || null,



          joined:

            participationMap[event.id] === "partecipo"



        }));






      setEvents(eventsWithStatus);






      if(eventsWithStatus.length > 0){



        const date =

          eventsWithStatus[0].data_evento;






        if(date){



          setDaysLeft(

            calculateDays(date)

          );



        }



      }






    }

    catch(error){



      console.log(

        "ERRORE GENERALE LOAD DATA:",

        error

      );



    }

    finally{



      console.log(

        "FINE LOAD DATA"

      );



      setCheckingSession(false);



    }



  }


  useEffect(()=>{


    loadData();


  },[]);







  useEffect(()=>{


    function refreshHome(){


      loadData();


    }





    window.addEventListener(

      "focus",

      refreshHome

    );





    return ()=>{


      window.removeEventListener(

        "focus",

        refreshHome

      );


    };


  },[]);









  if(checkingSession){


    return (

      <main className="
        min-h-screen
        p-6
      ">


        Caricamento...


      </main>

    );


  }







  if(!user){


    return (

      <main className="
        min-h-screen
        p-6
      ">


        <h1 className="
          text-2xl
          font-bold
        ">

          Devi effettuare il login

        </h1>


      </main>

    );


  }







  return (

    <main className="
      min-h-screen
      p-6
      pb-28
    ">



      <Header

        name={profile?.nome}

      />





      <NextEventCard

        event={events[0]}

        daysLeft={daysLeft}

      />





      {

        events[0] && (

          <PreparationMonti

            eventId={events[0].id}

            userId={user.id}

          />

        )

      }





      <MyStuff />





      <MyEvents

        events={events}

        isAdmin={profile?.ruolo === "admin"}

      />





      {/* <Curiosity /> */}



    </main>

  );


}