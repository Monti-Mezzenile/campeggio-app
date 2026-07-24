"use client";


import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import BackButton from "@/components/ui/BackButton";



export default function AddTentPage(){


  const params = useParams();

  const router = useRouter();


  const id = params.id as string;





  const [tents,setTents] = useState<any[]>([]);

  const [loading,setLoading] = useState(true);

  const [adding,setAdding] = useState(false);








  async function loadData(){


    setLoading(true);





    const {
      data:{
        session
      }
    } = await supabase.auth.getSession();






    if(!session){

      setLoading(false);

      return;

    }








    const {data,error}=await supabase

      .from("tents")

      .select("*")

      .eq("user_id",session.user.id)

      .order("created_at",{
        ascending:false
      });








    if(error){

      console.log(error);

    }







    setTents(data || []);

    setLoading(false);


  }









  async function addTent(tentId:string){



    if(adding){

      return;

    }



    setAdding(true);








    const {data:existing,error:checkError}=await supabase

      .from("event_tents")

      .select("id")

      .eq("event_id",id)

      .eq("tent_id",tentId);








    if(checkError){

      console.log(checkError);

      alert(checkError.message);

      setAdding(false);

      return;

    }








    if(existing && existing.length>0){

      alert("Questa tenda è già presente nell'evento");

      setAdding(false);

      return;

    }








    const {error}=await supabase

      .from("event_tents")

      .insert({

        event_id:id,

        tent_id:tentId

      });








    if(error){

      console.log(error);

      alert(error.message);

      setAdding(false);

      return;

    }








    router.push(`/events/${id}/tents`);


  }









  useEffect(()=>{


    loadData();


  },[]);









  if(loading){

    return (

      <main className="p-6">

        Caricamento tende...

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

      <BackButton label="Tende" />

      <h1 className="
        text-3xl
        font-bold
        mb-3
      ">

        ⛺ Le tue tende

      </h1>






      <p className="
        text-gray-500
        mb-6
      ">

        Scegli una delle tue tende personali da portare in questo evento.

      </p>








      {
        tents.length===0 &&


        <div className="
          bg-white
          border
          rounded-2xl
          p-6
          text-center
        ">



          <p>

            Non hai ancora tende salvate.

          </p>





          <button

            onClick={()=>router.push("/profile/tents/new")}

            className="
              mt-5
              bg-black
              text-white
              rounded-xl
              px-5
              py-3
            "

          >

            ➕ Crea nuova tenda

          </button>



        </div>


      }









      <div className="
        flex
        flex-col
        gap-4
      ">





        {
          tents.map((tent)=>(



            <div

              key={tent.id}

              className="
                bg-white
                border
                rounded-2xl
                p-5
              "

            >






              {
                tent.foto &&


                <img

                  src={tent.foto}

                  alt={tent.nome}

                  className="
                    w-full
                    h-48
                    object-contain
                    rounded-xl
                    mb-4
                  "

                />

              }








              <h2 className="
                text-xl
                font-bold
              ">

                ⛺ {tent.nome}

              </h2>








              <p className="
                text-gray-500
                mt-1
              ">

                {tent.marca} {tent.modello}

              </p>








              <p className="mt-3">

                🛏️ {tent.posti} posti letto

              </p>








              {
                tent.note &&


                <p className="
                  mt-3
                  text-gray-500
                ">

                  📝 {tent.note}

                </p>


              }









              <button

                disabled={adding}

                onClick={()=>addTent(tent.id)}

                className="
                  mt-5
                  w-full
                  bg-black
                  text-white
                  rounded-xl
                  py-3
                  disabled:opacity-50
                "

              >

                {
                  adding
                  ?
                  "Aggiunta..."
                  :
                  "➕ Porta questa tenda"
                }


              </button>






            </div>


          ))

        }




      </div>






    </main>


  );

}