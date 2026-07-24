"use client";


import { useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";





export default function NewTentPage(){


  const params = useParams();

  const router = useRouter();


  const eventId = params.id as string;





  const [nome,setNome] = useState("");

  const [marca,setMarca] = useState("");

  const [modello,setModello] = useState("");

  const [posti,setPosti] = useState("");

  const [note,setNote] = useState("");

  const [file,setFile] = useState<File | null>(null);

  const [loading,setLoading] = useState(false);








  async function createTent(){


    setLoading(true);





    const {
      data:{
        user
      }
    } = await supabase.auth.getUser();





    if(!user){

      alert("Devi essere loggato");

      setLoading(false);

      return;

    }








    let fotoUrl = "";








    // UPLOAD FOTO SU SUPABASE STORAGE

    if(file){


      const fileName = 
        `${user.id}-${Date.now()}-${file.name}`;





      const {error:uploadError}=await supabase

        .storage

        .from("tents")

        .upload(fileName,file);






      if(uploadError){


        console.log(uploadError);

        alert(uploadError.message);

        setLoading(false);

        return;


      }








      const {
        data
      } = supabase

        .storage

        .from("tents")

        .getPublicUrl(fileName);







      fotoUrl = data.publicUrl;



    }









    // CREA TENDA

    const {data:tent,error:tentError}=await supabase

      .from("tents")

      .insert({

        user_id:user.id,

        nome,

        marca,

        modello,

        posti:Number(posti),

        note,

        foto:fotoUrl

      })

      .select()

      .single();








    if(tentError){


      console.log(tentError);

      alert(tentError.message);

      setLoading(false);

      return;


    }









    // COLLEGA TENDA ALL'EVENTO

    const {error:eventTentError}=await supabase

      .from("event_tents")

      .insert({

        event_id:eventId,

        tent_id:tent.id

      });








    if(eventTentError){


      console.log(eventTentError);

      alert(eventTentError.message);

      setLoading(false);

      return;


    }








    router.push(

      `/events/${eventId}/tents`

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

        ⛺ Crea nuova tenda

      </h1>








      <div className="
        bg-white
        border
        rounded-2xl
        p-5
        flex
        flex-col
        gap-4
      ">





        <input

          placeholder="Nome tenda"

          value={nome}

          onChange={(e)=>setNome(e.target.value)}

          className="
            border
            rounded-xl
            p-3
          "

        />








        <input

          placeholder="Marca"

          value={marca}

          onChange={(e)=>setMarca(e.target.value)}

          className="
            border
            rounded-xl
            p-3
          "

        />








        <input

          placeholder="Modello"

          value={modello}

          onChange={(e)=>setModello(e.target.value)}

          className="
            border
            rounded-xl
            p-3
          "

        />








        <input

          placeholder="Numero posti"

          type="number"

          value={posti}

          onChange={(e)=>setPosti(e.target.value)}

          className="
            border
            rounded-xl
            p-3
          "

        />








        <div>

          <label className="
            block
            mb-2
            font-semibold
          ">

            Foto tenda

          </label>


          <input

            type="file"

            accept="image/*"

            onChange={(e)=>{

              if(e.target.files){

                setFile(e.target.files[0]);

              }

            }}

          />

        </div>








        <textarea

          placeholder="Note"

          value={note}

          onChange={(e)=>setNote(e.target.value)}

          className="
            border
            rounded-xl
            p-3
          "

        />








        <button

          onClick={createTent}

          disabled={loading}

          className="
            bg-black
            text-white
            rounded-xl
            p-4
            disabled:opacity-50
          "

        >

          {
            loading
            ?
            "Creazione..."
            :
            "Crea tenda"
          }


        </button>







      </div>






    </main>

  );

}