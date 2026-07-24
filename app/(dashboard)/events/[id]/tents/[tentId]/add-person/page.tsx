"use client";


import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import BackButton from "@/components/ui/BackButton";





export default function AddPersonPage(){


  const params = useParams();

  const router = useRouter();


  const eventId = params.id as string;

  const tentId = params.tentId as string;





  const [people,setPeople] = useState<any[]>([]);

  const [loading,setLoading] = useState(true);

  const [adding,setAdding] = useState<string | null>(null);


  const [postiTotali,setPostiTotali] = useState(0);

  const [postiOccupati,setPostiOccupati] = useState(0);

  const [tendaPiena,setTendaPiena] = useState(false);








  async function loadPeople(){


    setLoading(true);





    // Recupero informazioni tenda


    const {data:eventTent,error:eventTentError}=await supabase

      .from("event_tents")

      .select("tent_id")

      .eq("id",tentId)

      .single();






    if(eventTentError){

      console.log(eventTentError);

      setLoading(false);

      return;

    }








    const {data:tent}=await supabase

      .from("tents")

      .select("posti,user_id")

      .eq("id",eventTent.tent_id)

      .single();








    if(!tent){

      setLoading(false);

      return;

    }








    // conto persone già nella tenda


    const {count}=await supabase

      .from("tent_members")

      .select("*",{count:"exact",head:true})

      .eq("event_tent_id",tentId);








    const occupati = count || 0;







    setPostiTotali(tent.posti);

    setPostiOccupati(occupati);







    if(occupati >= tent.posti){


      setTendaPiena(true);

      setPeople([]);

      setLoading(false);

      return;


    }








    // Partecipanti evento


    const {data:eventMembers,error}=await supabase

      .from("event_members")

      .select("user_id")

      .eq("event_id",eventId);








    if(error){

      console.log(error);

      setLoading(false);

      return;

    }








    const userIds = (eventMembers || [])

      .map(person=>person.user_id);








    if(userIds.length === 0){

      setPeople([]);

      setLoading(false);

      return;

    }
    // Persone già assegnate a una tenda nello stesso evento

    const {data:eventTents}=await supabase

      .from("event_tents")

      .select("id")

      .eq("event_id",eventId);




    const tentIds = (eventTents || [])

      .map(tent=>tent.id);






    let assignedIds:string[] = [];





    if(tentIds.length > 0){


      const {data:assigned}=await supabase

        .from("tent_members")

        .select("user_id")

        .in("event_tent_id",tentIds);



      assignedIds = (assigned || [])

        .map(person=>person.user_id);


    }








    // tolgo persone già in una tenda

    const availableIds = userIds.filter(

      id=>!assignedIds.includes(id)

    );








    if(availableIds.length === 0){

      setPeople([]);

      setLoading(false);

      return;

    }








    // recupero profili disponibili


    const {data:profiles}=await supabase

      .from("profiles")

      .select("*")

      .in("id",availableIds);








    setPeople(profiles || []);

    setLoading(false);


  }












  async function addPerson(userId:string){



    setAdding(userId);





    // controllo sicurezza prima di inserire


    const {count}=await supabase

      .from("tent_members")

      .select("*",{count:"exact",head:true})

      .eq("event_tent_id",tentId);






    const {data:eventTent}=await supabase

      .from("event_tents")

      .select("tent_id")

      .eq("id",tentId)

      .single();






    const {data:tent}=await supabase

      .from("tents")

      .select("posti")

      .eq("id",eventTent?.tent_id)

      .single();






 
      if((count || 0) >= (tent?.posti || 0)){

      alert("Questa tenda è completa");

      setAdding(null);

      return;


    }









    const {error}=await supabase

      .from("tent_members")

      .insert({

        event_tent_id:tentId,

        user_id:userId

      });








    if(error){

      console.log("ERRORE TENT MEMBERS:",error);

      alert(error.message);

      setAdding(null);

      return;

    }







    router.push(

      `/events/${eventId}/tents/${tentId}`

    );


  }









  useEffect(()=>{


    if(tentId){

      loadPeople();

    }


  },[tentId]);








  if(loading){


    return (

      <main className="p-6">

        Caricamento partecipanti...

      </main>

    );


  }









  return (



    <main className="
      p-6
      max-w-3xl
      mx-auto
    ">

      <BackButton label="Gestione tenda" />

      <h1 className="
        text-3xl
        font-bold
        mb-6
      ">

        ➕ Aggiungi persona

      </h1>






      <div className="
        bg-white
        border
        rounded-2xl
        p-4
        mb-6
      ">


        🛏️ Posti occupati:

        <b>

          {" "}{postiOccupati}/{postiTotali}

        </b>


      </div>








      {
        tendaPiena &&


        <div className="
          bg-white
          border
          rounded-2xl
          p-6
          text-center
        ">


          ⛺ Tenda completa


        </div>


      }








      {
        !tendaPiena && people.length === 0 &&


        <div className="
          bg-white
          border
          rounded-2xl
          p-6
          text-center
        ">


          Nessuna persona disponibile


        </div>


      }








      <div className="
        flex
        flex-col
        gap-3
      ">



        {
          people.map(person=>(



            <div

              key={person.id}

              className="
                bg-white
                border
                rounded-2xl
                p-4
                flex
                items-center
                justify-between
              "

            >




              <div className="
                flex
                items-center
                gap-3
              ">




                {
                  person.avatar_url ?


                  <img

                    src={person.avatar_url}

                    className="
                      w-12
                      h-12
                      rounded-full
                      object-cover
                    "

                  />


                  :


                  <div className="
                    w-12
                    h-12
                    rounded-full
                    bg-gray-200
                    flex
                    items-center
                    justify-center
                  ">


                    👤


                  </div>


                }





                <b>

                  {person.nome}

                </b>




              </div>








              <button

                disabled={adding===person.id}

                onClick={()=>addPerson(person.id)}

                className="
                  bg-black
                  text-white
                  rounded-xl
                  px-4
                  py-2
                "

              >


                {
                  adding===person.id

                  ?

                  "..."

                  :

                  "Aggiungi"

                }


              </button>







            </div>



          ))

        }



      </div>






    </main>


  );

}