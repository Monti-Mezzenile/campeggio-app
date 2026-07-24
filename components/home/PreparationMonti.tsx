// app/components/PreparationMonti.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import Card from "@/components/ui/Card";


interface PreparationProps {
  eventId: string;
  userId: string;
}


export default function PreparationMonti({
  eventId,
  userId
}: PreparationProps) {


  const router = useRouter();


  const [loading,setLoading] = useState(true);

  const [items,setItems] = useState<any[]>([]);


  const [checklist,setChecklist] = useState({

    total:0,

    completed:0,

    percentage:0

  });





  async function loadPreparation(){


    const checks:any[] = [];





    // =====================
    // TENDA
    // =====================


    const {data:tentMember}=await supabase
      .from("tent_members")
      .select("id")
      .eq("user_id",userId);



    if(!tentMember || tentMember.length===0){

      checks.push({

        icon:"⛺",

        text:"Scegli la tua tenda",

        link:`/events/${eventId}/tents`

      });

    }






    // =====================
    // AUTO
    // =====================


    const {data:trip}=await supabase
      .from("trips")
      .select("id")
      .eq("event_id",eventId)
      .maybeSingle();



    let hasCar=false;



    if(trip){


      const {data:driverCar}=await supabase
        .from("trip_cars")
        .select("id")
        .eq("trip_id",trip.id)
        .eq("driver_id",userId);



      const {data:passenger}=await supabase
        .from("trip_passengers")
        .select("id")
        .eq("user_id",userId);



      hasCar =
        !!driverCar?.length ||
        !!passenger?.length;

    }





    if(!hasCar){

      checks.push({

        icon:"🚗",

        text:"Scegli il tuo passaggio",

        link:`/events/${eventId}/cars`

      });

    }






    // =====================
    // CHECKLIST
    // =====================


    const {data:myChecklist}=await supabase
      .from("checklists")
      .select("id")
      .eq("event_id",eventId)
      .eq("user_id",userId)
      .maybeSingle();



    if(myChecklist){


      const {data:checkItems}=await supabase
        .from("checklist_items")
        .select("*")
        .eq("checklist_id",myChecklist.id);



      const total = checkItems?.length || 0;


      const completed =
        checkItems?.filter(
          item=>item.completato
        ).length || 0;



      const percentage = total
        ? Math.round(completed / total * 100)
        : 0;



      setChecklist({

        total,

        completed,

        percentage

      });





      if(total > 0 && completed < total){


        checks.push({

          icon:"🎒",

          text:`Checklist ${completed}/${total} (${percentage}%)`,

          link:`/events/${eventId}/checklist`

        });


      }


    }






    // =====================
    // ATTREZZATURA
    // =====================


    const {data:equipment}=await supabase
      .from("event_equipment")
      .select("id")
      .eq("event_id",eventId)
      .eq("assegnato_a",userId)
      .eq("confermato",false);



    if(equipment && equipment.length>0){


      checks.push({

        icon:"🧰",

        text:`Conferma ${equipment.length} oggetti`,

        link:`/events/${eventId}/equipment`

      });


    }








    // =====================
    // CARNE
    // =====================


    const {data:meatCall}=await supabase
      .from("shopping_calls")
      .select("*")
      .eq("event_id",eventId)
      .eq("tipo","carne")
      .eq("user_id",userId)
      .eq("prenotato",false)
      .maybeSingle();





    if(meatCall){


      checks.push({

        icon:"🥩",

        text:"Chiamare per la carne",

        link:`/events/${eventId}/shopping?tab=carne`

      });


    }







    setItems(checks);

    setLoading(false);


  }







  useEffect(()=>{


    if(eventId && userId){

      loadPreparation();

    }


  },[eventId,userId]);







  if(loading){

    return null;

  }







  return (

    <section className="mt-8">


      <h2 className="
        text-xl
        font-semibold
        mb-4
      ">

        🏕️ Preparazioni per MONTI

      </h2>





      <Card>


        {

          items.length===0

          ?

          (

            <div className="
              text-center
              py-4
            ">

              <p className="text-2xl">

                🎉

              </p>


              <p className="
                font-semibold
                mt-2
              ">

                Sei pronto per il MONTI!

              </p>


            </div>

          )

          :

          (

            <div className="
              flex
              flex-col
              gap-3
            ">


              {
                checklist.total > 0 &&
                checklist.completed === checklist.total &&

                (

                  <div className="
                    bg-green-50
                    rounded-xl
                    p-3
                  ">

                    🎒 Checklist completata!

                  </div>

                )

              }





              {
                items.map(item=>(


                  <button

                    key={item.text}

                    onClick={()=>router.push(item.link)}

                    className="
                      flex
                      items-center
                      gap-3
                      text-left
                      w-full
                    "

                  >

                    <span className="text-xl">

                      {item.icon}

                    </span>


                    <span>

                      {item.text}

                    </span>


                    <span className="ml-auto">

                      ›

                    </span>


                  </button>


                ))

              }



            </div>

          )

        }


      </Card>


    </section>

  );


}