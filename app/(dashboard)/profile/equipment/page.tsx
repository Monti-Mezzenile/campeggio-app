"use client";


import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import BackButton from "@/components/ui/BackButton";



export default function EquipmentPage(){


  const [equipment,setEquipment] = useState<any[]>([]);

  const [loading,setLoading] = useState(true);



  const [nome,setNome] = useState("");

  const [categoria,setCategoria] = useState("Altro");

  const [quantita,setQuantita] = useState(1);

  const [note,setNote] = useState("");









  async function loadEquipment(){


    setLoading(true);




    const {
      data:{
        user
      }
    } = await supabase.auth.getUser();






    if(!user){

      setLoading(false);

      return;

    }







    const {data,error}=await supabase

      .from("equipment")

      .select("*")

      .eq("user_id",user.id)

      .order("created_at",{
        ascending:false
      });








    if(error){

      console.log(error);

    }





    setEquipment(data || []);

    setLoading(false);


  }









  async function addEquipment(){



    const {
      data:{
        user
      }
    } = await supabase.auth.getUser();





    if(!user){

      return;

    }








    if(!nome.trim()){

      alert("Inserisci un nome");

      return;

    }







    const {error}=await supabase

      .from("equipment")

      .insert({

        user_id:user.id,

        nome,

        categoria,

        quantita,

        note

      });








    if(error){

      console.log(error);

      alert(error.message);

      return;

    }








    setNome("");

    setCategoria("Altro");

    setQuantita(1);

    setNote("");



    loadEquipment();


  }









  async function deleteEquipment(id:string){



    const ok = confirm(

      "Eliminare questa attrezzatura?"

    );





    if(!ok){

      return;

    }








    const {error}=await supabase

      .from("equipment")

      .delete()

      .eq("id",id);








    if(error){

      console.log(error);

      alert(error.message);

      return;

    }








    loadEquipment();


  }








  useEffect(()=>{


    loadEquipment();


  },[]);








  if(loading){

    return (

      <main className="p-6">

        Caricamento attrezzatura...

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

     <BackButton label="Profilo" />

      <h1 className="
        text-3xl
        font-bold
        mb-6
      ">

        🎒 La mia attrezzatura

      </h1>









      <div className="
        bg-white
        border
        rounded-2xl
        p-5
        mb-8
      ">



        <h2 className="
          font-bold
          text-xl
          mb-4
        ">

          ➕ Aggiungi oggetto

        </h2>







        <input

          placeholder="Nome oggetto"

          value={nome}

          onChange={(e)=>setNome(e.target.value)}

          className="
            w-full
            border
            rounded-xl
            p-3
            mb-3
          "

        />








        <select

          value={categoria}

          onChange={(e)=>setCategoria(e.target.value)}

          className="
            w-full
            border
            rounded-xl
            p-3
            mb-3
          "

        >

          <option>

            Attrezzatura Campeggio 

          </option>

          <option>

            Cucina e Bagno

          </option>

          <option>

            Persona e Comfort

          </option>

          <option>

            Divertimento ed Extra

          </option>

          <option>

            Altro

          </option>


        </select>








        <input

          type="number"

          min="1"

          value={quantita}

          onChange={(e)=>setQuantita(Number(e.target.value))}

          className="
            w-full
            border
            rounded-xl
            p-3
            mb-3
          "

        />








        <textarea

          placeholder="Note"

          value={note}

          onChange={(e)=>setNote(e.target.value)}

          className="
            w-full
            border
            rounded-xl
            p-3
            mb-3
          "

        />








        <button

          onClick={addEquipment}

          className="
            w-full
            bg-black
            text-white
            rounded-xl
            p-3
          "

        >

          Salva attrezzatura

        </button>





      </div>









      <div className="
        flex
        flex-col
        gap-4
      ">





        {
          equipment.length === 0 &&


          <div className="
            bg-white
            border
            rounded-2xl
            p-6
            text-center
          ">

            Nessuna attrezzatura salvata

          </div>


        }








        {
          equipment.map(item=>(


            <div

              key={item.id}

              className="
                bg-white
                border
                rounded-2xl
                p-5
              "

            >



              <div className="
                flex
                justify-between
                items-start
              ">



                <div>


                  <h2 className="
                    text-xl
                    font-bold
                  ">

                    🎒 {item.nome}

                  </h2>





                  <p className="text-gray-500">

                    {item.categoria}

                  </p>





                  <p className="mt-2">

                    Quantità: <b>{item.quantita}</b>

                  </p>





                  {
                    item.note &&

                    <p className="
                      mt-2
                      text-gray-500
                    ">

                      📝 {item.note}

                    </p>

                  }


                </div>







                <button

                  onClick={()=>deleteEquipment(item.id)}

                  className="
                    text-red-600
                    text-xl
                  "

                >

                  🗑️

                </button>





              </div>



            </div>


          ))

        }



      </div>






    </main>

  );


}