"use client";


import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import { useRouter } from "next/navigation";



export default function NewEventPage(){


  const router = useRouter();



  const [checking,setChecking] = useState(true);

  const [saving,setSaving] = useState(false);



  const [form,setForm] = useState({

    titolo:"",

    descrizione:"",

    luogo:"",

    data_inizio:"",

    data_fine:"",

    status:"aperto"

  });









  async function checkAdmin(){



    const {

      data:{
        user
      }

    } = await supabase.auth.getUser();





    if(!user){

      router.push("/");

      return;

    }








    const {data:profile,error}=await supabase

      .from("profiles")

      .select("ruolo")

      .eq("id",user.id)

      .single();







    if(error){

      console.log(error);

      router.push("/");

      return;

    }








    if(profile?.ruolo !== "admin"){

      alert("Non hai i permessi per creare eventi");

      router.push("/");

      return;

    }







    setChecking(false);


  }









  async function createEvent(){



    setSaving(true);




    const {

      data:{
        user
      }

    } = await supabase.auth.getUser();





    if(!user){

      setSaving(false);

      return;

    }







    const {data:event,error}=await supabase

      .from("events")

      .insert({

        titolo:form.titolo,

        descrizione:form.descrizione,

        luogo:form.luogo,

        data_inizio:form.data_inizio,

        data_fine:form.data_fine,

        status:form.status,

        creato_da:user.id

      })

      .select()

      .single();








    if(error){

      console.log(error);

      alert(error.message);

      setSaving(false);

      return;

    }







    await supabase

      .from("event_members")

      .insert({

        event_id:event.id,

        user_id:user.id,

        stato:"confermato"

      });







    router.push(`/events/${event.id}`);


  }









  useEffect(()=>{


    checkAdmin();


  },[]);









  if(checking){


    return (

      <main className="p-6">

        Controllo permessi...

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





      <h1 className="
        text-3xl
        font-bold
        mb-6
      ">

        🏕️ Crea evento

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

            placeholder="Es. Winter Monti 2026"

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









        <button

          onClick={createEvent}

          disabled={saving}

          className="
            bg-black
            text-white
            rounded-xl
            p-3
            w-full
            font-semibold
          "

        >

          {

            saving

            ?

            "Creazione..."

            :

            "🏕️ Crea evento"

          }


        </button>






      </div>






    </main>


  );

}