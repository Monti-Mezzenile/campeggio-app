"use client";


import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";



export default function CuriositaDettaglioPage(){


  const router = useRouter();

  const params = useParams();


  const id = params.id as string;



  const [curiosita,setCuriosita] = useState<any>(null);

  const [loading,setLoading] = useState(true);









  async function loadCuriosita(){


    const {

      data,

      error

    } = await supabase

      .from("curiosities")

      .select("*")

      .eq(

        "id",

        id

      )

      .single();





    if(error){

      console.log(error);

      return;

    }





    setCuriosita(data);

    setLoading(false);



  }








  useEffect(()=>{


    if(id){

      loadCuriosita();

    }


  },[id]);









  async function deleteCuriosita(){


    const conferma = confirm(

      "Eliminare questa curiosità?"

    );


    if(!conferma){

      return;

    }






    const {error}=await supabase

      .from("curiosities")

      .delete()

      .eq(

        "id",

        id

      );






    if(error){

      alert(error.message);

      return;

    }





    router.push("/curiosita");


  }









  if(loading){


    return (

      <main className="p-6">

        Caricamento...

      </main>

    );


  }








  if(!curiosita){


    return (

      <main className="p-6">

        Curiosità non trovata

      </main>

    );


  }









  return (

    <main className="
      min-h-screen
      pb-28
      max-w-3xl
      mx-auto
      p-6
    ">





      <button

        onClick={()=>router.back()}

        className="
          mb-6
          text-gray-500
        "

      >

        ← Indietro

      </button>









      {

        curiosita.immagine_url && (


          <img

            src={curiosita.immagine_url}

            className="
              w-full
              h-72
              object-cover
              rounded-3xl
              mb-6
            "

          />


        )

      }









      <h1 className="
        text-3xl
        font-bold
        mb-4
      ">

        {curiosita.titolo}

      </h1>









      {

        curiosita.audio_url && (


          <section className="
            bg-purple-50
            rounded-3xl
            p-5
            mb-6
          ">


            <h2 className="
              font-bold
              mb-3
            ">

              🎧 Audio

            </h2>



            <audio

              controls

              className="w-full"

            >

              <source

                src={curiosita.audio_url}

              />

            </audio>


          </section>


        )

      }









      <section className="
        bg-white
        rounded-3xl
        border
        p-6
      ">


        <p className="
          whitespace-pre-line
          leading-relaxed
        ">

          {curiosita.contenuto}

        </p>



      </section>









      {


        curiosita.tipo === "community" && (


          <button

            onClick={deleteCuriosita}

            className="
              mt-6
              w-full
              bg-red-100
              text-red-600
              rounded-3xl
              p-4
              font-bold
            "

          >

            🗑️ Elimina curiosità


          </button>


        )


      }







    </main>


  );


}