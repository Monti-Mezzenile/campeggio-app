"use client";


import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import Button from "@/components/ui/Button";







export default function JoinEventPage(){



  const params = useParams();

  const router = useRouter();



  const id = params.id as string;






  const [event,setEvent] = useState<any>(null);

  const [user,setUser] = useState<any>(null);


  const [loading,setLoading] = useState(true);



  const [scelta,setScelta] = useState<

    "partecipo" | "forse" | "non_posso" | null

  >(null);





  const [arrivoData,setArrivoData] = useState("");

  const [arrivoOra,setArrivoOra] = useState("");



  const [partenzaData,setPartenzaData] = useState("");

  const [partenzaOra,setPartenzaOra] = useState("");









  async function loadData(){



    const {

      data:{
        user
      }

    } = await supabase.auth.getUser();





    if(user){

      setUser(user);

    }









    const {data:eventData,error}=await supabase

      .from("events")

      .select("*")

      .eq("id",id)

      .single();







    if(error){

      console.log(error);

      return;

    }






    setEvent(eventData);







    setLoading(false);


  }









  useEffect(()=>{


    if(id){

      loadData();

    }


  },[id]);









  function formatDate(date:string){


    if(!date){

      return "";

    }


    return date.split("T")[0];


  }








  function generateHours(){


    return Array.from({length:30}).map((_,i)=>{


      const totaleMinuti =

        (9 * 60)

        +

        (i * 30);



      const ore = Math.floor(totaleMinuti / 60)

        .toString()

        .padStart(2,"0");



      const minuti = (totaleMinuti % 60)

        .toString()

        .padStart(2,"0");



      return `${ore}:${minuti}`;


    });


  }





  if(loading){


    return (

      <main className="p-6">

        Caricamento...

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








  const isWinter = event.titolo

    ?.toLowerCase()

    .includes("winter");









  const minDate = formatDate(

    event.data_inizio ||

    event.data_evento

  );





  const maxDate = formatDate(

    event.data_fine ||

    event.data_inizio ||

    event.data_evento

  );













  return (

    <main className="
      min-h-screen
      p-6
      pb-28
      max-w-3xl
      mx-auto
    ">






      <div className="
        text-center
        mb-8
      ">



        <div className="
          text-6xl
          mb-4
        ">

          {
            isWinter

            ?

            "⛺️❅"

            :

            "🏕️"

          }

        </div>






        <h1 className="
          text-3xl
          font-bold
        ">

          {
            isWinter

            ?

            "Si vede che sei pronto alle grandi sfide"

            :

            "Vedo che anche tu hai sentito il richiamo di Monti"

          }

        </h1>







        <p className="
          text-gray-500
          mt-3
        ">

          {event.titolo}

        </p>



      </div>









      <div className="
        flex
        flex-col
        gap-4
      ">


        <button

          onClick={()=>setScelta("partecipo")}

          className={`

            border

            rounded-3xl

            p-5

            text-left

            transition


            ${
              scelta==="partecipo"

              ?

              "bg-black text-white scale-[1.02] shadow-lg"

              :

              "bg-white"

            }

          `}

        >


          <div className="
            text-3xl
            mb-2
          ">

            🟢

          </div>





          <h2 className="
            text-xl
            font-bold
          ">

            CI SARÒ

          </h2>





          <p className="
            mt-2
            opacity-80
          ">

            Il richiamo di Monti è troppo forte.

          </p>



        </button>
                <button

          onClick={()=>setScelta("forse")}

          className={`

            border

            rounded-3xl

            p-5

            text-left

            transition


            ${
              scelta==="forse"

              ?

              "bg-black text-white scale-[1.02] shadow-lg"

              :

              "bg-white"

            }

          `}

        >


          <div className="
            text-3xl
            mb-2
          ">

            🟡

          </div>





          <h2 className="
            text-xl
            font-bold
          ">

            FORSE

          </h2>





          <p className="
            mt-2
            opacity-80
          ">

            Il mio cervello dice sì, il calendario dice boh.

          </p>



        </button>









        <button

          onClick={()=>setScelta("non_posso")}

          className={`

            border

            rounded-3xl

            p-5

            text-left

            transition


            ${
              scelta==="non_posso"

              ?

              "bg-black text-white scale-[1.02] shadow-lg"

              :

              "bg-white"

            }

          `}

        >


          <div className="
            text-3xl
            mb-2
          ">

            🔴

          </div>





          <h2 className="
            text-xl
            font-bold
          ">

            NON POSSO

          </h2>





          <p className="
            mt-2
            opacity-80
          ">

            Sono un soffice batuffolo con le orecchie lunghe.

          </p>



        </button>








      </div>







      {


        scelta==="partecipo" &&


        <div className="
          bg-white
          border
          rounded-3xl
          p-5
          mt-6
        ">



          <h2 className="
            text-xl
            font-bold
            mb-4
          ">

            🏕️ Organizza il viaggio

          </h2>








          <label className="
            block
            mb-3
          ">

            📅 Arrivo


            <input

              type="date"

              min={minDate}

              max={maxDate}

              value={arrivoData}

              onChange={(e)=>
                setArrivoData(e.target.value)
              }

              className="
                w-full
                border
                rounded-xl
                p-3
                mt-1
              "

            />


          </label>








          <label className="
            block
            mb-3
          ">

            🕘 Ora arrivo


            <select

              value={arrivoOra}

              onChange={(e)=>
                setArrivoOra(e.target.value)
              }

              className="
                w-full
                border
                rounded-xl
                p-3
                mt-1
              "

            >


              <option value="">

                Seleziona ora

              </option>



              {

                generateHours().map((ora)=>(


                  <option

                    key={ora}

                    value={ora}

                  >

                    {ora}

                  </option>


                ))

              }



            </select>


          </label>









          <label className="
            block
            mb-3
          ">

            📅 Partenza


            <input

              type="date"

              min={minDate}

              max={maxDate}

              value={partenzaData}

              onChange={(e)=>
                setPartenzaData(e.target.value)
              }

              className="
                w-full
                border
                rounded-xl
                p-3
                mt-1
              "

            />


          </label>








          <label className="
            block
          ">

            🕘 Ora partenza


            <select

              value={partenzaOra}

              onChange={(e)=>
                setPartenzaOra(e.target.value)
              }

              className="
                w-full
                border
                rounded-xl
                p-3
                mt-1
              "

            >


              <option value="">

                Seleziona ora

              </option>



              {

                generateHours().map((ora)=>(


                  <option

                    key={ora}

                    value={ora}

                  >

                    {ora}

                  </option>


                ))

              }



            </select>


          </label>





        </div>


      }








      <div className="
        mt-8
      ">



        <Button

          onClick={saveParticipation}

        >

          Conferma

        </Button>



      </div>







    </main>

  );









  async function saveParticipation(){



    if(!user || !scelta){


      alert("Scegli come parteciperai");


      return;


    }







    const payload = {


      event_id:id,


      user_id:user.id,


      stato:scelta,



      arrivo_data:

        scelta==="partecipo"

        ?

        arrivoData || null

        :

        null,



      arrivo_ora:

        scelta==="partecipo"

        ?

        arrivoOra || null

        :

        null,



      partenza_data:

        scelta==="partecipo"

        ?

        partenzaData || null

        :

        null,



      partenza_ora:

        scelta==="partecipo"

        ?

        partenzaOra || null

        :

        null,


    };







    const {data:existing,error:checkError}=await supabase

      .from("event_members")

      .select("id")

      .eq("event_id",id)

      .eq("user_id",user.id)

      .maybeSingle();







    if(checkError){


      console.log(checkError);


      alert(checkError.message);


      return;


    }








    let error;







    if(existing){


      const result = await supabase

        .from("event_members")

        .update(payload)

        .eq("id",existing.id);


      error=result.error;


    }

    else {


      const result = await supabase

        .from("event_members")

        .insert(payload);


      error=result.error;


    }








    if(error){


      console.log(error);


      alert(error.message);


      return;


    }








    /*
      CREA CHECKLIST PERSONALE AUTOMATICA
    */


    if(

      scelta==="partecipo" ||

      scelta==="forse"

    ){



      const {data:existingChecklist}=await supabase

        .from("checklists")

        .select("id")

        .eq("event_id",id)

        .eq("user_id",user.id)

        .maybeSingle();






      if(!existingChecklist){



        await supabase

          .from("checklists")

          .insert({

            event_id:id,

            user_id:user.id

          });



      }



    }








    router.push(`/events/${id}`);



  }








}