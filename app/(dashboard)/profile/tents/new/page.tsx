"use client";


import { useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";





export default function NewProfileTentPage(){


  const router = useRouter();




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

      alert("Utente non trovato");

      setLoading(false);

      return;

    }








    let fotoUrl="";








    if(file){



      const fileName =
        `${user.id}-${Date.now()}-${file.name}`;






      const {error:uploadError}=await supabase

        .storage

        .from("tents")

        .upload(fileName,file);







      if(uploadError){

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







      fotoUrl=data.publicUrl;



    }









    const {error}=await supabase

      .from("tents")

      .insert({

        user_id:user.id,

        nome,

        marca,

        modello,

        posti:Number(posti),

        note,

        foto:fotoUrl

      });







    if(error){

      console.log(error);

      alert(error.message);

      setLoading(false);

      return;

    }








    router.push("/profile/tents");


  }









  return (

    <main className="
      p-6
      max-w-3xl
      mx-auto
    ">


      <h1 className="
        text-3xl
        font-bold
        mb-6
      ">

        ⛺ Aggiungi tenda

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

          className="border rounded-xl p-3"

        />





        <input

          placeholder="Marca"

          value={marca}

          onChange={(e)=>setMarca(e.target.value)}

          className="border rounded-xl p-3"

        />





        <input

          placeholder="Modello"

          value={modello}

          onChange={(e)=>setModello(e.target.value)}

          className="border rounded-xl p-3"

        />





        <input

          placeholder="Posti"

          type="number"

          value={posti}

          onChange={(e)=>setPosti(e.target.value)}

          className="border rounded-xl p-3"

        />





        <input

          type="file"

          accept="image/*"

          onChange={(e)=>{

            if(e.target.files){

              setFile(e.target.files[0]);

            }

          }}

        />





        <textarea

          placeholder="Note"

          value={note}

          onChange={(e)=>setNote(e.target.value)}

          className="border rounded-xl p-3"

        />







        <button

          onClick={createTent}

          disabled={loading}

          className="
            bg-black
            text-white
            rounded-xl
            p-4
          "

        >

          {
            loading
            ?
            "Salvataggio..."
            :
            "Salva tenda"
          }


        </button>





      </div>


    </main>

  );


}