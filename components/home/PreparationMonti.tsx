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



    console.log(
      "PREPARATION EVENT:",
      eventId
    );



    console.log(
      "PREPARATION USER:",
      userId
    );





    /*
      TENDA
    */


    const {data:tentMember,error:tentError}=await supabase

      .from("tent_members")

      .select("id")

      .eq("user_id",userId);



    if(tentError){

      console.log(
        "ERRORE TENDA:",
        tentError
      );

    }





    if(!tentMember || tentMember.length===0){


      checks.push({

        icon:"⛺",

        text:"SCEGLI LA TUA TENDA",

        link:`/events/${eventId}/tents`

      });


    }









    /*
      MACCHINA
    */


    const {data:trip}=await supabase

      .from("trips")

      .select("id")

      .eq("event_id",eventId)

      .limit(1)
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

        text:"ORGANIZZA IL VIAGGIO",

        link:`/events/${eventId}/cars`

      });


    }
    /*
      CHECKLIST PERSONALE
    */





    const {

      data:myChecklists,

      error:checkError

    } = await supabase

      .from("checklists")

      .select("id")

      .eq("event_id",eventId)

      .eq("user_id",userId)

      .limit(1);








    console.log(

      "CHECKLIST TROVATA:",

      myChecklists,

      checkError

    );







    const myChecklist = myChecklists?.[0];







    if(myChecklist){



      const {

        data:checkItems,

        error:itemError

      } = await supabase

        .from("checklist_items")

        .select("*")

        .eq(

          "checklist_id",

          myChecklist.id

        );







      console.log(

        "CHECKLIST ITEMS:",

        checkItems,

        itemError

      );







      const total =

        checkItems?.length || 0;





      const completed =

        checkItems?.filter(

          item=>item.completato === true

        ).length || 0;







      const percentage = total

        ? Math.round(

            completed / total * 100

          )

        : 0;








      setChecklist({

        total,

        completed,

        percentage

      });








      if(

        total > 0 &&

        completed < total

      ){


        checks.push({

          icon:"🎒",

          text:`CHECKLIST ${completed}/${total}`,

          link:`/events/${eventId}/checklist`

        });


      }



    }









    /*
      EQUIPMENT
    */



    const {data:equipment}=await supabase

      .from("event_equipment")

      .select("id")

      .eq("event_id",eventId)

      .eq("assegnato_a",userId)

      .eq("confermato",false);






    if(equipment && equipment.length>0){


      checks.push({

        icon:"🧰",

        text:`CONFERMA ${equipment.length} OGGETTI`,

        link:`/events/${eventId}/equipment`

      });


    }









    /*
      CARNE
    */


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

        text:"PRENOTA LA CARNE",

        link:`/events/${eventId}/shopping?tab=carne`

      });


    }








    console.log(

      "CHECKS FINALI PREPARATION:",

      checks

    );







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

    <section className="mt-3">


      <h2 className="
        text-xs
        font-bold
        uppercase
        tracking-widest
        text-[#FFF4E3]
        mb-2
      ">

        PREPARIAMO IL CAMPO

      </h2>





      <Card>


        {


          items.length===0


          ?


          (

            <div className="
              text-center
              py-3
            ">


              <p className="
                text-2xl
              ">

                🎉

              </p>



              <p className="
                mt-2
                font-semibold
                text-[#1f2041]
              ">

                Sei pronto per MONTI!

              </p>


            </div>


          )


          :


          (

            <div>




              {

                checklist.total > 0 &&

                checklist.completed === checklist.total &&


                (

                  <div className="
                    rounded-xl
                    bg-[#6c9a8b]
                    text-[#ebdec8]
                    px-3
                    py-2
                    font-semibold
                    text-center
                    text-sm
                    mb-3
                  ">


                    🎒 CHECKLIST COMPLETATA!


                  </div>


                )


              }





              <div
                className="
                  flex
                  gap-3
                  overflow-x-auto
                  pb-2
                  -mx-1
                  px-1
                  snap-x
                  snap-mandatory
                  scrollbar-hide
                "
              >




                {


                  items.map(item=>(


                    <button


                      key={item.text}


                      onClick={()=>router.push(item.link)}



                      className="
                        flex
                        items-center
                        gap-3
                        min-w-[175px]
                        h-[58px]
                        px-4
                        rounded-2xl
                        bg-[#ebdec8]/50
                        hover:bg-[#ebdec8]/80
                        transition
                        shadow-sm
                        snap-start
                      "


                    >



                      <span
                        className="
                          text-xl
                          shrink-0
                        "
                      >

                        {item.icon}

                      </span>





                      <span
                        className="
                          flex-1
                          text-left
                          text-[#1f2041]
                          text-xs
                          font-bold
                          uppercase
                          leading-tight
                        "
                      >

                        {item.text}

                      </span>





                      <span
                        className="
                          text-[#3D3E62]
                          text-lg
                          ml-auto
                        "
                      >

                        ›

                      </span>





                    </button>


                  ))

                }



              </div>





              {

                items.length > 2 &&


                (

                  <div
                    className="
                      flex
                      justify-center
                      mt-2
                    "
                  >

                    <span
                      className="
                        text-[10px]
                        uppercase
                        tracking-[0.2em]
                        text-[#201E1B]
                      "
                    >

                      SCORRI →

                    </span>


                  </div>


                )


              }



            </div>


          )


        }




      </Card>




    </section>

  );


}