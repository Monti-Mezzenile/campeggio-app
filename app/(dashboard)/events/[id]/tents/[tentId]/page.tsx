"use client";


import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import BackButton from "@/components/ui/BackButton";



export default function TentDetailPage(){


  const params = useParams();

  const router = useRouter();


  const eventId = params.id as string;

  const tentId = params.tentId as string;





  const [tent,setTent] = useState<any>(null);

  const [owner,setOwner] = useState<any>(null);

  const [members,setMembers] = useState<any[]>([]);

  const [loading,setLoading] = useState(true);









  async function loadTent(){


    setLoading(true);





    const {data:eventTent,error:eventTentError}=await supabase

      .from("event_tents")

      .select("*")

      .eq("id",tentId)

      .single();







    if(eventTentError){

      console.log(eventTentError);

      setLoading(false);

      return;

    }








    const {data:tentData}=await supabase

      .from("tents")

      .select("*")

      .eq("id",eventTent.tent_id)

      .single();








    if(!tentData){

      setLoading(false);

      return;

    }







    setTent({

      ...tentData,

      eventTentId:eventTent.id

    });









    const {data:ownerData}=await supabase

      .from("profiles")

      .select("*")

      .eq("id",tentData.user_id)

      .single();







    setOwner(ownerData);









    const {data:membersData}=await supabase

      .from("tent_members")

      .select("id,user_id")

      .eq("event_tent_id",eventTent.id);








    if(membersData && membersData.length > 0){



      const ids = membersData.map(

        member => member.user_id

      );







      const {data:profiles}=await supabase

        .from("profiles")

        .select("*")

        .in("id",ids);







      const formattedMembers = membersData.map(member => {


        const profile = (profiles || []).find(

          p => p.id === member.user_id

        );



        return {

          ...profile,

          tentMemberId: member.id

        };


      });







      setMembers(formattedMembers);



    }else{


      setMembers([]);


    }








    setLoading(false);



  }









  async function removePerson(tentMemberId:string){



    console.log(
      "TENT MEMBER DA ELIMINARE:",
      tentMemberId
    );





    const confirmDelete = confirm(

      "Rimuovere questa persona dalla tenda?"

    );






    if(!confirmDelete){

      return;

    }








    const {error}=await supabase

      .from("tent_members")

      .delete()

      .eq("id",tentMemberId);








    if(error){

      console.log(error);

      alert(error.message);

      return;

    }








    loadTent();


  }









  async function removeTentFromEvent(){



    const confirmDelete = confirm(

      "Sei sicuro di voler rimuovere questa tenda dall'evento?"

    );








    if(!confirmDelete){

      return;

    }








    const {error}=await supabase

      .from("event_tents")

      .delete()

      .eq("id",tentId);








    if(error){

      console.log(error);

      alert(error.message);

      return;

    }








    router.push(

      `/events/${eventId}/tents`

    );


  }









  useEffect(()=>{


    if(tentId){

      loadTent();

    }


  },[tentId]);








  if(loading){

    return (

      <main className="p-6">

        Caricamento tenda...

      </main>

    );

  }








  if(!tent){

    return (

      <main className="p-6">

        Tenda non trovata

      </main>

    );

  }








  const occupati = members.length;

  const liberi = tent.posti - occupati;









  return (

    <main className="
      p-6
      pb-32
      max-w-3xl
      mx-auto
    ">

      <BackButton label="tende" />

      <h1 className="
        text-3xl
        font-bold
        mb-6
      ">

        ⛺ {tent.nome}

      </h1>








      {
        tent.foto &&


        <img

          src={tent.foto}

          alt={tent.nome}

          className="
            w-full
            h-52
            object-contain
            rounded-2xl
            mb-6
          "

        />

      }








      <div className="
        bg-white
        border
        rounded-2xl
        p-5
      ">



        <p>

          🏕️ {tent.marca} {tent.modello}

        </p>





        <p className="mt-3">

          🛏️ Posti:

          <b> {tent.posti}</b>

        </p>





        <p className="mt-3">

          👥 Occupati:

          <b> {occupati}/{tent.posti}</b>

        </p>





        <p className="mt-3">

          ✅ Posti liberi:

          <b> {liberi}</b>

        </p>



      </div>









      <section className="mt-8">


        <h2 className="
          text-xl
          font-bold
          mb-4
        ">

          👑 Proprietario

        </h2>






        {
          owner &&

          <PersonCard

            person={owner}

            owner

          />

        }


      </section>









      <section className="mt-8">


        <h2 className="
          text-xl
          font-bold
          mb-4
        ">

          👥 Persone nella tenda

        </h2>







        {
          members.length === 0 &&

          <p>

            Nessuna persona assegnata

          </p>

        }








        <div className="
          flex
          flex-col
          gap-3
        ">


          {
            members.map((person)=>(


              <PersonCard

                key={person.tentMemberId}

                person={person}

                removePerson={removePerson}

              />


            ))

          }


        </div>






      </section>









      <button

        onClick={()=>{

          router.push(

            `/events/${eventId}/tents/${tentId}/add-person`

          );

        }}

        className="
          mt-8
          w-full
          bg-black
          text-white
          rounded-xl
          p-4
        "

      >

        ➕ Aggiungi persona


      </button>








      <button

        onClick={removeTentFromEvent}

        className="
          mt-4
          w-full
          bg-red-600
          text-white
          rounded-xl
          p-4
        "

      >

        🗑️ Rimuovi dall'evento


      </button>







    </main>

  );

}









function PersonCard({

  person,

  owner=false,

  removePerson

}:any){



  return (

    <div className="
      flex
      items-center
      justify-between
      gap-4
      bg-white
      border
      rounded-2xl
      p-4
    ">



      <div className="
        flex
        items-center
        gap-4
      ">



      {
        person?.avatar_url ?

        <img

          src={person.avatar_url}

          alt={person.nome}

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







      <div>


        <p className="font-bold">

          {person?.nome}

        </p>





        {
          owner &&


          <p className="
            text-sm
            text-gray-500
          ">

            Proprietario tenda

          </p>


        }



      </div>


      </div>









      {
        !owner &&


        <button

          onClick={()=>removePerson(person.tentMemberId)}

          className="
            text-red-600
            text-xl
          "

        >

          🗑️

        </button>


      }






    </div>

  );

}