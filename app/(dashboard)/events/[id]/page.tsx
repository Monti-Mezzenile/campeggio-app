"use client";


import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";


import EventHeader from "@/components/event/EventHeader";
import EventStatCard from "@/components/event/EventStatCard";

import Button from "@/components/ui/Button";






export default function EventPage(){



  const params = useParams();

  const router = useRouter();


  const id = params.id as string;





  const [isAdmin,setIsAdmin] = useState(false);


  const [event,setEvent] = useState<any>(null);


  const [user,setUser] = useState<any>(null);


  const [myParticipation,setMyParticipation] = useState<any>(null);


  const [loading,setLoading] = useState(true);







  const [stats,setStats] = useState({

    partecipanti:0,

    tende:0,

    postiLetto:0,

    auto:0,

    postiAuto:0,

    attrezzatura:0,

    checklistTotale:0,

    checklistCompletata:0,

    mediaCount:0,

    shoppingCount:0

  });









  function formatArrivalDeparture(

    date:string,

    time:string,

    label:string

  ){


    if(!date){

      return null;

    }



    const data = new Date(date);



    const giorni=[

      "domenica",
      "lunedì",
      "martedì",
      "mercoledì",
      "giovedì",
      "venerdì",
      "sabato"

    ];



    let momento="";



    if(time){


      const ora=parseInt(

        time.split(":")[0]

      );



      if(ora < 5){

        momento="notte";

      }

      else if(ora < 12){

        momento="mattina";

      }

      else if(ora < 18){

        momento="pomeriggio";

      }

      else{

        momento="sera";

      }

    }





    return (

      <p>

        {label} {giorni[data.getDay()]}


        {

          momento &&

          ` ${momento}`

        }



        {

          time &&

          ` alle ${String(time).slice(0,5)}`

        }


      </p>

    );


  }









  async function loadEvent(){


    setLoading(true);




    const {

      data:{
        user

      }

    } = await supabase.auth.getUser();






    if(user){


      setUser(user);





      const {data:profile}=await supabase

        .from("profiles")

        .select("ruolo")

        .eq("id",user.id)

        .single();





      setIsAdmin(

        profile?.ruolo==="admin"

      );







      const {data:myData}=await supabase

        .from("event_members")

        .select("*")

        .eq("event_id",id)

        .eq("user_id",user.id)

        .maybeSingle();





      setMyParticipation(myData);



    }









    const {

      data:eventData,

      error:eventError

    } = await supabase

      .from("events")

      .select("*")

      .eq("id",id)

      .single();







    if(eventError){


      console.log(eventError);


      setLoading(false);


      return;


    }







    setEvent(eventData);









    const {count:partecipanti}=await supabase

      .from("event_members")

      .select("*",{count:"exact",head:true})

      .eq("event_id",id)

      .eq("stato","partecipo");









    const {data:eventTents}=await supabase

      .from("event_tents")

      .select("tent_id")

      .eq("event_id",id);






    let postiLetto=0;







    if(eventTents && eventTents.length){


      const ids=eventTents.map(

        t=>t.tent_id

      );





      const {data:tents}=await supabase

        .from("tents")

        .select("posti")

        .in("id",ids);





      postiLetto=(tents || [])

        .reduce(

          (tot,t)=>

            tot+(t.posti || 0),

          0

        );


    }









    const {data:tripCars}=await supabase

      .from("trip_cars")

      .select("posti_disponibili")

      .eq("trip_id",id);









    const {count:attrezzatura}=await supabase

      .from("event_equipment")

      .select("*",{count:"exact",head:true})

      .eq("event_id",id);








    const {count:mediaCount}=await supabase

      .from("media")

      .select("*",{count:"exact",head:true})

      .eq("event_id",id);








    const {count:shoppingItems}=await supabase

      .from("shopping_items")

      .select("*",{count:"exact",head:true})

      .eq("event_id",id);






    const {count:meatItems}=await supabase

      .from("meat_items")

      .select("*",{count:"exact",head:true})

      .eq("event_id",id);





    const shoppingCount =

      (shoppingItems || 0)

      +

      (meatItems || 0);








    const {data:checklists}=await supabase

      .from("checklists")

      .select("id")

      .eq("event_id",id);







    let checklistTotale=0;

    let checklistCompletata=0;








    if(checklists && checklists.length){



      const {data:checklistItems}=await supabase

        .from("checklist_items")

        .select("completato")

        .in(

          "checklist_id",

          checklists.map(c=>c.id)

        );






      checklistTotale=

        checklistItems?.length || 0;





      checklistCompletata=

        checklistItems?.filter(

          item=>item.completato

        ).length || 0;


    }









    const postiAuto=(tripCars || [])

      .reduce(

        (tot,car)=>

          tot+(car.posti_disponibili || 0),

        0

      );







    setStats({


      partecipanti:partecipanti || 0,


      tende:eventTents?.length || 0,


      postiLetto,


      auto:tripCars?.length || 0,


      postiAuto,


      attrezzatura:attrezzatura || 0,


      checklistTotale,


      checklistCompletata,


      mediaCount:mediaCount || 0,


      shoppingCount


    });








    setLoading(false);


  }
    useEffect(()=>{


    if(id){


      loadEvent();


    }


  },[id]);









  async function removeParticipation(){



    if(!user){

      return;

    }






    const ok = window.confirm(

      "Vuoi davvero non partecipare più a questo evento?"

    );







    if(!ok){

      return;

    }








    const {data:rows,error:findError}=await supabase

      .from("event_members")

      .select("id")

      .eq("event_id",id)

      .eq("user_id",user.id);







    if(findError){

      alert(findError.message);

      return;

    }







    if(!rows || rows.length===0){

      alert("Nessuna partecipazione trovata");

      return;

    }







    const ids=rows.map(row=>row.id);







    const {error}=await supabase

      .from("event_members")

      .delete()

      .in("id",ids);







    if(error){

      alert(error.message);

      return;

    }







    setMyParticipation(null);

    router.push("/");


  }












 async function deleteEvent(){



  const ok = confirm(

    "Sei sicuro di voler eliminare questo evento?"

  );






  if(!ok){

    return;

  }







  const {data,error}=await supabase

    .from("events")

    .delete()

    .eq("id",id)

    .select();







  if(error){

    alert(error.message);

    return;

  }







  if(!data || data.length===0){



    alert(

      "Evento non eliminato"

    );



    return;



  }







  router.push("/");


 }















  const tabs=[



    {


      titolo:"Partecipanti",

      icona:"👥",

      valore:stats.partecipanti,

      sottotitolo:"I veri coraggiosi",

      percorso:`/events/${id}/participants`


    },





    {


      titolo:"Checklist personale",

      icona:"✅",

      valore:

        `${stats.checklistCompletata}/${stats.checklistTotale}`,

      sottotitolo:"oggetti preparati",

      percorso:`/events/${id}/checklist`


    },





    {


      titolo:"Equipaggiamento totale",

      icona:"🎒",

      valore:stats.attrezzatura,

      sottotitolo:

        stats.attrezzatura > 0

        ?

        "oggetti dell'evento"

        :

        "da organizzare",

      percorso:`/events/${id}/equipment`


    },





    {


      titolo:"Cibo",

      icona:"🛒",

      valore:stats.shoppingCount,

      sottotitolo:"Menù e spesa",

      percorso:`/events/${id}/shopping`


    },





    {


      titolo:"Spese",

      icona:"💶",

      valore:"0",

      sottotitolo:"Dividi i costi",

      percorso:`/events/${id}/expenses`


    },





    {


      titolo:"Auto",

      icona:"🚗",

      valore:stats.auto,

      sottotitolo:



        stats.postiAuto >= stats.partecipanti



        ?



        `🚙 ${stats.postiAuto} posti · OK`



        :



        `🚙 ${stats.postiAuto} posti · Mancano ${stats.partecipanti-stats.postiAuto}`,



      percorso:`/events/${id}/cars`


    },





    {


      titolo:"Tende",

      icona:"⛺",

      valore:stats.tende,

      sottotitolo:



        stats.postiLetto >= stats.partecipanti



        ?



        `🛏 ${stats.postiLetto} posti letto · OK`



        :



        `🛏 ${stats.postiLetto} posti · Mancano ${stats.partecipanti-stats.postiLetto}`,



      percorso:`/events/${id}/tents`


    },





    {


      titolo:"Foto e Video",

      icona:"📸",

      valore:stats.mediaCount,

      sottotitolo:"ricordi evento",

      percorso:`/events/${id}/media`


    }



  ];






  if(loading){


    return (

      <main className="p-6">

        Caricamento evento...

      </main>

    );

  }








  if(!event){


    return (

      <main className="p-6">

        Evento non trovato

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







      <div className="relative">


        <EventHeader


          titolo={event.titolo}


          luogo={event.luogo}


          data={

            event.data_inizio

            ?

            `${event.data_inizio}${
              
              event.data_fine

              ?

              ` → ${event.data_fine}`

              :

              ""

            }`

            :

            event.data_evento

          }


        />







        {


          isAdmin && (



            <div

              className="
                absolute
                top-5
                right-5
                flex
                gap-2
              "

            >





              <button

                onClick={()=>router.push(`/events/${id}/edit`)}

                className="
                  bg-white/20
                  text-white
                  rounded-xl
                  p-2
                  text-lg
                "

              >

                ✏️

              </button>







              <button

                onClick={deleteEvent}

                className="
                  bg-red-500
                  text-white
                  rounded-xl
                  p-2
                  text-lg
                "

              >

                🗑️

              </button>



            </div>


          )


        }



      </div>













      <div className="
        bg-white
        border
        rounded-3xl
        p-5
        mb-6
      ">






        <h2 className="
          text-xl
          font-bold
          mb-4
        ">

          🙋 La mia partecipazione

        </h2>









        {


          myParticipation ?


          <>



            <p className="
              font-semibold
              text-green-600
            ">

              🟢 Partecipo

            </p>








            <div className="
              mt-4
              text-gray-600
              space-y-1
            ">





              {

                formatArrivalDeparture(

                  myParticipation.arrivo_data,

                  myParticipation.arrivo_ora,

                  "🏕️ Arrivo"

                )

              }





              {

                formatArrivalDeparture(

                  myParticipation.partenza_data,

                  myParticipation.partenza_ora,

                  "🚗 Partenza"

                )

              }



            </div>









            <div className="
              flex
              gap-3
              mt-5
            ">



              <Button

                onClick={()=>router.push(`/events/${id}/join`)}

              >

                ✏️ Modifica

              </Button>







              <button

                onClick={removeParticipation}

                className="
                  border
                  rounded-xl
                  px-4
                "

              >

                ❌

              </button>



            </div>





          </>







          :






          <Button

            onClick={()=>router.push(`/events/${id}/join`)}

          >

            Partecipa

          </Button>



        }





      </div>














      <div className="
        grid
        grid-cols-2
        gap-4
        items-stretch
      ">






        {


          tabs.map(tab=>(



            <button


              key={tab.titolo}



              onClick={()=>router.push(tab.percorso)}



              className="
                text-left
                h-full
              "


            >





              <EventStatCard



                icona={tab.icona}



                titolo={tab.titolo}



                valore={tab.valore}



                descrizione={tab.sottotitolo}



              />





            </button>



          ))



        }





      </div>









    </main>

  );


}