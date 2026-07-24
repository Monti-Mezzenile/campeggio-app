"use client";


import { useEffect, useState } from "react";

import Link from "next/link";

import { supabase } from "@/lib/supabase";

import Card from "@/components/ui/Card";



export default function HistoryPage(){


  const [events,setEvents] = useState<any[]>([]);

  const [loading,setLoading] = useState(true);





  useEffect(()=>{


    async function loadEvents(){


      const {

        data,

        error

      } = await supabase


        .from("events")


        .select("*")


        .order(

          "data_inizio",

          {

            ascending:false

          }

        );





      if(error){


        console.log(

          "Errore caricamento eventi:",

          error

        );


      }





      setEvents(data || []);

      setLoading(false);



    }




    loadEvents();



  },[]);







  if(loading){


    return (


      <main className="
        min-h-screen
        p-6
        pb-28
      ">


        Caricamento...


      </main>


    );


  }








  return (


    <main className="
      min-h-screen
      p-6
      pb-28
    ">



      <h1 className="
        text-3xl
        font-bold
        mb-6
      ">


        📚 Storico


      </h1>







      {


        events.length === 0 ?



        <p className="text-gray-500">


          Nessun evento presente


        </p>



        :



        <div className="
          flex
          flex-col
          gap-4
        ">



          {


            events.map(event=>(



              <Link


                key={event.id}


                href={`/events/${event.id}`}


              >



                <Card>



                  <h2 className="
                    text-xl
                    font-bold
                  ">


                    🏕️ {event.titolo}


                  </h2>






                  <p className="
                    text-gray-500
                    mt-2
                  ">


                    📍 {event.luogo}


                  </p>






                  <p className="text-gray-500">


                    📅 {


                      event.data_inizio ||

                      event.data_evento


                    }


                  </p>






                </Card>




              </Link>



            ))



          }




        </div>



      }





    </main>


  );


}