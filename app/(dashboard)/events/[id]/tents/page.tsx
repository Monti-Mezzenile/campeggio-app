"use client";


import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import BackButton from "@/components/ui/BackButton";


export default function TentsPage(){


  const params = useParams();

  const router = useRouter();


  const id = params.id as string;



  const [tents,setTents] = useState<any[]>([]);

  const [loading,setLoading] = useState(true);







  async function loadTents(){



    setLoading(true);




    const {data:eventTents,error}=await supabase

      .from("event_tents")

      .select("*")

      .eq("event_id",id);






    if(error){

      console.log(error);

      setLoading(false);

      return;

    }








    const result = await Promise.all(



      (eventTents || []).map(async(eventTent:any)=>{





        const {data:tent}=await supabase

          .from("tents")

          .select("*")

          .eq("id",eventTent.tent_id)

          .single();








        const {count:members}=await supabase

          .from("tent_members")

          .select("*",{count:"exact",head:true})

          .eq("event_tent_id",eventTent.id);







        return {

          ...eventTent,

          tent,

          members:members || 0

        };



      })



    );





    setTents(result);

    setLoading(false);


  }








  useEffect(()=>{


    if(id){

      loadTents();

    }


  },[id]);







  if(loading){

    return (

      <main className="p-6">

        Caricamento tende...

      </main>

    );

  }








  return (

    <main className="
      p-6
      pb-28
      max-w-3xl
      mx-auto
    ">

      <BackButton label="Evento" />

      <h1 className="
        text-3xl
        font-bold
        mb-5
      ">

        ⛺ Tende

      </h1>







      <button

        onClick={()=>router.push(`/events/${id}/tents/add`)}

        className="
          w-full
          bg-black
          text-white
          rounded-2xl
          p-4
          mb-6
        "

      >

        ➕ Aggiungi tenda

      </button>







      {
        tents.length === 0 &&


        <div className="
          bg-white
          border
          rounded-2xl
          p-6
          text-center
        ">

          Nessuna tenda aggiunta

        </div>


      }








      <div className="
        flex
        flex-col
        gap-4
      ">


        {

          tents.map((item)=>(


            <TentCard

              key={item.id}

              item={item}

              eventId={id}

              router={router}

            />


          ))

        }


      </div>






    </main>

  );

}









function TentCard({

  item,

  eventId,

  router

}:any){





  const [open,setOpen] = useState(false);



  const tent=item.tent;




  if(!tent){

    return null;

  }






  const posti = tent.posti || 0;

  const occupati = item.members || 0;

  const liberi = posti - occupati;








  return (

    <div

      className="
        bg-white
        border
        rounded-2xl
        p-5
      "

    >





      <div

        onClick={()=>setOpen(!open)}

        className="
          cursor-pointer
        "

      >



        <div className="
          flex
          justify-between
          items-center
        ">



          <div>


            <h2 className="
              text-xl
              font-bold
            ">

              ⛺ {tent.nome}

            </h2>





            <p className="
              text-gray-500
            ">

              {tent.marca} {tent.modello}

            </p>





            <p className="mt-3">

              👥 {occupati}/{posti} occupati

            </p>



          </div>






          <div>

            {open ? "▲" : "▼"}

          </div>


        </div>






        {
          tent.foto &&


          <img

            src={tent.foto}

            alt={tent.nome}

            className="
              w-full
              h-40
              object-contain
              rounded-xl
              mt-4
            "

          />

        }



      </div>







      {
        open &&


        <div className="
          mt-5
          pt-5
          border-t
        ">



          <p>

            🛏 Posti disponibili:

            <b> {liberi}</b>

          </p>






          {
            tent.note &&


            <p className="mt-3">

              📝 {tent.note}

            </p>


          }








          <button

            onClick={()=>{

              router.push(
                `/events/${eventId}/tents/${item.id}`
              );

            }}

            className="
              mt-5
              w-full
              bg-black
              text-white
              rounded-xl
              p-3
            "

          >

            Gestisci tenda

          </button>





        </div>


      }





    </div>

  );

}