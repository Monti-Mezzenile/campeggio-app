"use client";


import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import BackButton from "@/components/ui/BackButton";

export default function EditEventPage(){


  const params = useParams();

  const router = useRouter();


  const id = params.id as string;



  const [loading,setLoading] = useState(true);

  const [saving,setSaving] = useState(false);



  const [form,setForm] = useState({

    titolo:"",

    descrizione:"",

    luogo:"",

    data_inizio:"",

    data_fine:"",

    status:"aperto"

  });









  async function loadEvent(){



    const {

      data:{
        user
      }

    } = await supabase.auth.getUser();





    if(!user){

      router.push("/");

      return;

    }







    const {data:event,error}=await supabase

      .from("events")

      .select("*")

      .eq("id",id)

      .single();








    if(error){

      console.log(error);

      router.push("/");

      return;

    }








    const {data:profile}=await supabase

  .from("profiles")

  .select("ruolo")

  .eq("id",user.id)

  .single();





if(profile?.ruolo !== "admin"){

  alert("Non hai i permessi per modificare questo evento");

  router.push(`/events/${id}`);

  return;

}







    setForm({

      titolo:event.titolo || "",

      descrizione:event.descrizione || "",

      luogo:event.luogo || "",

      data_inizio:event.data_inizio || "",

      data_fine:event.data_fine || "",

      status:event.status || "aperto"

    });





    setLoading(false);


  }









  async function saveEvent(){



    setSaving(true);






    const {error}=await supabase

      .from("events")

      .update({

        titolo:form.titolo,

        descrizione:form.descrizione,

        luogo:form.luogo,

        data_inizio:form.data_inizio,

        data_fine:form.data_fine,

        status:form.status

      })

      .eq("id",id);








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

      loadEvent();

    }


  },[id]);









  if(loading){

    return (

      <main className="p-6">

        Caricamento...

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
        mb-6
      ">

        ✏️ Modifica evento

      </h1>









      <div className="
        bg-white
        border
        rounded-3xl
        p-6
        space-y-5
      ">









        <div>

          <label className="font-semibold">

            Titolo evento

          </label>



          <input

            value={form.titolo}

            onChange={(e)=>

              setForm({

                ...form,

                titolo:e.target.value

              })

            }

            className="
              w-full
              border
              rounded-xl
              p-3
              mt-2
            "

          />


        </div>









        <div>

          <label className="font-semibold">

            Descrizione

          </label>



          <textarea

            value={form.descrizione}

            onChange={(e)=>

              setForm({

                ...form,

                descrizione:e.target.value

              })

            }

            className="
              w-full
              border
              rounded-xl
              p-3
              mt-2
              min-h-28
            "

          />

        </div>









        <div>

          <label className="font-semibold">

            Luogo

          </label>



          <input

            value={form.luogo}

            onChange={(e)=>

              setForm({

                ...form,

                luogo:e.target.value

              })

            }

            className="
              w-full
              border
              rounded-xl
              p-3
              mt-2
            "

          />

        </div>









        <div className="
          grid
          grid-cols-2
          gap-4
        ">


          <div>

            <label className="font-semibold">

              📅 Arrivo

            </label>



            <input

              type="date"

              value={form.data_inizio}

              onChange={(e)=>

                setForm({

                  ...form,

                  data_inizio:e.target.value

                })

              }

              className="
                w-full
                border
                rounded-xl
                p-3
                mt-2
              "

            />

          </div>







          <div>

            <label className="font-semibold">

              📅 Partenza

            </label>



            <input

              type="date"

              value={form.data_fine}

              onChange={(e)=>

                setForm({

                  ...form,

                  data_fine:e.target.value

                })

              }

              className="
                w-full
                border
                rounded-xl
                p-3
                mt-2
              "

            />

          </div>



        </div>









        <div>

          <label className="font-semibold">

            Stato

          </label>



          <select

            value={form.status}

            onChange={(e)=>

              setForm({

                ...form,

                status:e.target.value

              })

            }

            className="
              w-full
              border
              rounded-xl
              p-3
              mt-2
            "

          >

            <option value="aperto">

              🟢 Aperto

            </option>


            <option value="preparazione">

              🟡 In preparazione

            </option>


            <option value="chiuso">

              🔴 Chiuso

            </option>


          </select>


        </div>









        <div className="
  flex
  gap-3
">


  <button

    onClick={()=>router.push(`/events/${id}`)}

    className="
      w-1/3
      border
      rounded-xl
      p-3
      font-semibold
    "

  >

    Annulla

  </button>





  <button

    onClick={saveEvent}

    disabled={saving}

    className="
      w-2/3
      bg-black
      text-white
      rounded-xl
      p-3
      font-semibold
      disabled:opacity-50
    "

  >

    {

      saving

      ?

      "Salvataggio..."

      :

      "💾 Salva modifiche"

    }


  </button>


</div>







      </div>






    </main>


  );

}