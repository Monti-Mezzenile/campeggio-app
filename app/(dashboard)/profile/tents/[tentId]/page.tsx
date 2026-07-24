"use client";


import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";





export default function EditTentPage(){


  const params = useParams();

  const router = useRouter();


  const tentId = params.tentId as string;





  const [nome,setNome]=useState("");

  const [marca,setMarca]=useState("");

  const [modello,setModello]=useState("");

  const [posti,setPosti]=useState("");

  const [note,setNote]=useState("");

  const [loading,setLoading]=useState(true);








  async function loadTent(){



    const {data,error}=await supabase

      .from("tents")

      .select("*")

      .eq("id",tentId)

      .single();








    if(error){

      console.log(error);

      return;

    }








    setNome(data.nome || "");

    setMarca(data.marca || "");

    setModello(data.modello || "");

    setPosti(data.posti || "");

    setNote(data.note || "");

    setLoading(false);


  }









  async function saveTent(){



    const {error}=await supabase

      .from("tents")

      .update({

        nome,

        marca,

        modello,

        posti:Number(posti),

        note

      })

      .eq("id",tentId);








    if(error){

      console.log(error);

      alert(error.message);

      return;

    }








    router.push("/profile/tents");


  }








  useEffect(()=>{


    loadTent();


  },[]);








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
      max-w-3xl
      mx-auto
    ">



      <h1 className="
        text-3xl
        font-bold
        mb-6
      ">

        ✏️ Modifica tenda

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

          value={nome}

          onChange={(e)=>setNome(e.target.value)}

          placeholder="Nome"

          className="border rounded-xl p-3"

        />






        <input

          value={marca}

          onChange={(e)=>setMarca(e.target.value)}

          placeholder="Marca"

          className="border rounded-xl p-3"

        />






        <input

          value={modello}

          onChange={(e)=>setModello(e.target.value)}

          placeholder="Modello"

          className="border rounded-xl p-3"

        />






        <input

          type="number"

          value={posti}

          onChange={(e)=>setPosti(e.target.value)}

          placeholder="Posti"

          className="border rounded-xl p-3"

        />






        <textarea

          value={note}

          onChange={(e)=>setNote(e.target.value)}

          placeholder="Note"

          className="border rounded-xl p-3"

        />








        <button

          onClick={saveTent}

          className="
            bg-black
            text-white
            rounded-xl
            p-4
          "

        >

          Salva modifiche

        </button>






      </div>






    </main>


  );


}