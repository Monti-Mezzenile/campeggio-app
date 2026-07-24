"use client";


import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";




export default function JoinEventPage(){


  const params = useParams();

  const router = useRouter();


  const id = params.id as string;



  const [event,setEvent] = useState<any>(null);

  const [user,setUser] = useState<any>(null);

  const [loading,setLoading] = useState(true);

  const [saving,setSaving] = useState(false);




  const [form,setForm] = useState({

    arrivo_data:"",

    arrivo_ora:"",

    partenza_data:"",

    partenza_ora:""

  });









  async function loadData(){



    const {

      data:{
        user
      }

    } = await supabase.auth.getUser();



    if(!user){

      router.push("/");

      return;

    }



    setUser(user);








    const {data:eventData,error:eventError}=await supabase

      .from("events")

      .select("*")

      .eq("id",id)

      .single();







    if(eventError){

      console.log(eventError);

      return;

    }





    setEvent(eventData);







    const {data:member}=await supabase

      .from("event_members")

      .select("*")

      .eq("event_id",id)

      .eq("user_id",user.id)

      .maybeSingle();






    if(member){


      setForm({

        arrivo_data:member.arrivo_data || "",

        arrivo_ora:member.arrivo_ora || "",

        partenza_data:member.partenza_data || "",

        partenza_ora:member.partenza_ora || ""

      });


    }







    setLoading(false);


  }









  async function save(){


    setSaving(true);






    const {error}=await supabase

      .from("event_members")

      .upsert({

        event_id:id,

        user_id:user.id,

        stato:"partecipo",

        arrivo_data:form.arrivo_data,

        arrivo_ora:form.arrivo_ora,

        partenza_data:form.partenza_data,

        partenza_ora:form.partenza_ora

      });








    if(error){

      console.log(error);

      alert(error.message);

      setSaving(false);

      return;

    }







    router.push(`/events/${id}`);


  }









  useEffect(()=>{


    if(id){

      loadData();

    }


  },[id]);








  if(loading){

    return (

      <main className="p-6">

        Caricamento...

      </main>

    );

  }









  const isWinter = event?.titolo

    ?.toLowerCase()

    .includes("winter");









  return (

    <main className="
      p-6
      pb-28
      max-w-3xl
      mx-auto
    ">






      <div className="
        bg-black
        text-white
        rounded-3xl
        p-6
        mb-6
        text-center
      ">



        <div className="text-5xl mb-4">

          {
            isWinter

            ?

            "⛺️❅"

            :

            "🏕️"

          }

        </div>






        <h1 className="
          text-2xl
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




      </div>









      <div className="
        bg-white
        border
        rounded-3xl
        p-6
        space-y-5
      ">






        <h2 className="
          text-xl
          font-bold
        ">

          Quando arrivi?

        </h2>





        <input

          type="date"

          value={form.arrivo_data}

          onChange={(e)=>

            setForm({

              ...form,

              arrivo_data:e.target.value

            })

          }

          className="
            w-full
            border
            rounded-xl
            p-3
          "

        />






        <input

          type="time"

          value={form.arrivo_ora}

          onChange={(e)=>

            setForm({

              ...form,

              arrivo_ora:e.target.value

            })

          }

          className="
            w-full
            border
            rounded-xl
            p-3
          "

        />









        <h2 className="
          text-xl
          font-bold
          mt-6
        ">

          Quando riparti?

        </h2>






        <input

          type="date"

          value={form.partenza_data}

          onChange={(e)=>

            setForm({

              ...form,

              partenza_data:e.target.value

            })

          }

          className="
            w-full
            border
            rounded-xl
            p-3
          "

        />






        <input

          type="time"

          value={form.partenza_ora}

          onChange={(e)=>

            setForm({

              ...form,

              partenza_ora:e.target.value

            })

          }

          className="
            w-full
            border
            rounded-xl
            p-3
          "

        />









        <button

          onClick={save}

          disabled={saving}

          className="
            w-full
            bg-black
            text-white
            rounded-xl
            p-3
            font-semibold
          "

        >


          {

            saving

            ?

            "Salvataggio..."

            :

            "🏕️ Conferma partecipazione"

          }


        </button>





      </div>





    </main>

  );


}