"use client";


import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { supabase } from "@/lib/supabase";



export default function CuriositaDetailPage(){


  const params = useParams();


  const id = params.id as string;



  const [curiosita,setCuriosita]=useState<any>(null);

  const [loading,setLoading]=useState(true);






  async function load(){


    const {data,error}=await supabase

      .from("curiosities")

      .select("*")

      .eq(

        "id",

        id

      )

      .single();





    if(error){

      console.log(error);

      setLoading(false);

      return;

    }





    setCuriosita(data);

    setLoading(false);


  }







  useEffect(()=>{


    if(id){

      load();

    }


  },[id]);









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


        {curiosita.titolo}


      </h1>






      {

        curiosita.immagine_url &&


        <img

          src={curiosita.immagine_url}

          className="
            w-full
            rounded-3xl
            mb-6
          "

        />


      }






      {

        curiosita.audio_url &&


        <audio

          controls

          src={curiosita.audio_url}

          className="
            w-full
            mb-6
          "

        />


      }








      <p className="
        whitespace-pre-line
        text-lg
        leading-relaxed
      ">


        {curiosita.contenuto}


      </p>






    </main>


  );


}