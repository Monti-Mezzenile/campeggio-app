"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";



export default function NuovaCuriositaPage(){


  const router = useRouter();



  const [titolo,setTitolo]=useState("");

  const [contenuto,setContenuto]=useState("");



  const [immagine,setImmagine]=useState<File | null>(null);

  const [audio,setAudio]=useState<File | null>(null);



  const [preview,setPreview]=useState("");

  const [saving,setSaving]=useState(false);







  function handleImage(e:any){


    const file=e.target.files?.[0];


    if(!file)return;



    setImmagine(file);


    setPreview(

      URL.createObjectURL(file)

    );


  }







  function handleAudio(e:any){


    const file=e.target.files?.[0];


    if(!file)return;



    setAudio(file);


  }









  async function uploadFile(

    file:File,

    folder:string

  ){


    const filename =

      `${folder}/${Date.now()}-${file.name}`;





    const {error}=await supabase.storage

      .from("curiosities")

      .upload(

        filename,

        file

      );





    if(error){


      console.log(

        "ERRORE UPLOAD FILE:",

        error

      );


      throw new Error(

        "Errore caricamento file: " + error.message

      );


    }







    const {data}=supabase.storage

      .from("curiosities")

      .getPublicUrl(

        filename

      );





    return data.publicUrl;


  }









  async function createCuriosita(){



    if(

      !titolo.trim()

      ||

      !contenuto.trim()

    ){


      alert(

        "Inserisci titolo e contenuto"

      );


      return;

    }






    try{


      setSaving(true);





      let immagine_url="";

      let audio_url="";







      if(immagine){


        immagine_url=

          await uploadFile(

            immagine,

            "immagini"

          );


      }







      if(audio){


        audio_url=

          await uploadFile(

            audio,

            "audio"

          );


      }







      const {error}=await supabase

        .from("curiosities")

        .insert({


          titolo,


          contenuto,


          immagine_url,


          audio_url,


          tipo:"community",


          ordine:0


        });







      if(error){


        throw error;

      }







      router.push(

        "/curiosita"

      );





    }

    catch(error:any){


      console.log(

        error

      );


      alert(

        error.message

      );


    }

    finally{


      setSaving(false);


    }


  }









  return (

    <main className="
      p-6
      pb-28
      max-w-3xl
      mx-auto
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






      <h1 className="
        text-3xl
        font-bold
        mb-6
      ">

        ➕ Nuova curiosità

      </h1>






      <section className="
        bg-white
        border
        rounded-3xl
        p-6
      ">






        <label className="font-semibold">

          Immagine copertina

        </label>



        <input

          type="file"

          accept="image/*"

          onChange={handleImage}

          className="
            mt-2
            mb-4
          "

        />






        {

          preview &&


          <img

            src={preview}

            className="
              w-full
              rounded-3xl
              mb-6
            "

          />

        }








        <label className="font-semibold">

          Audio MP3

        </label>



        <input

          type="file"

          accept="audio/*"

          onChange={handleAudio}

          className="
            mt-2
            mb-4
          "

        />









        <input

          value={titolo}

          onChange={e=>setTitolo(e.target.value)}

          placeholder="Titolo"

          className="
            w-full
            border
            rounded-xl
            p-3
            mb-4
          "

        />







        <textarea

          value={contenuto}

          onChange={e=>setContenuto(e.target.value)}

          placeholder="Scrivi la curiosità..."

          className="
            w-full
            border
            rounded-xl
            p-3
            h-60
          "

        />









        <button

          onClick={createCuriosita}

          disabled={saving}

          className="
            mt-6
            w-full
            bg-black
            text-white
            rounded-xl
            p-3
          "

        >

          {

            saving

            ?

            "Salvataggio..."

            :

            "Crea curiosità"

          }


        </button>







      </section>







    </main>


  );


}