"use client";


import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import BackButton from "@/components/ui/BackButton";



export default function ProfileTentsPage(){


  const router = useRouter();


  const [tents,setTents] = useState<any[]>([]);

  const [loading,setLoading] = useState(true);

  const [deleting,setDeleting] = useState<string | null>(null);









  async function loadTents(){


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

      .from("tents")

      .select("*")

      .eq("user_id",user.id)

      .order("created_at",{
        ascending:false
      });








    if(error){

      console.log(error);

    }






    setTents(data || []);

    setLoading(false);


  }









  async function deleteTent(id:string){



    const confirmDelete = confirm(
      "Sei sicuro di voler eliminare definitivamente questa tenda?"
    );






    if(!confirmDelete){

      return;

    }






    setDeleting(id);








    const {error}=await supabase

      .from("tents")

      .delete()

      .eq("id",id);








    if(error){

      console.log(error);

      alert(error.message);

      setDeleting(null);

      return;

    }








    setTents(prev=>

      prev.filter(tent=>tent.id!==id)

    );





    setDeleting(null);


  }









  useEffect(()=>{


    loadTents();


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

      <BackButton label="Profilo" />

      <div className="
        flex
        justify-between
        items-center
        mb-6
      ">


        <h1 className="
          text-3xl
          font-bold
        ">

          ⛺ Le mie tende

        </h1>






        <button

          onClick={()=>router.push("/profile/tents/new")}

          className="
            bg-black
            text-white
            rounded-xl
            px-4
            py-3
          "

        >

          +

        </button>



      </div>









      {
        tents.length===0 &&


        <div className="
          bg-white
          border
          rounded-2xl
          p-6
          text-center
        ">

          Nessuna tenda salvata

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
                    rounded-xl
                    object-contain
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







              <p className="text-gray-500">

                {tent.marca} {tent.modello}

              </p>







              <p className="mt-3">

                🛏️ {tent.posti} posti

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

  onClick={()=>router.push(`/profile/tents/${tent.id}`)}

  className="
    mt-5
    w-full
    bg-gray-800
    text-white
    rounded-xl
    p-3
  "

>

  ✏️ Modifica tenda

</button>




              <button

                onClick={()=>deleteTent(tent.id)}

                disabled={deleting===tent.id}

                className="
                  mt-5
                  w-full
                  bg-red-600
                  text-white
                  rounded-xl
                  p-3
                  disabled:opacity-50
                "

              >

                {
                  deleting===tent.id
                  ?
                  "Eliminazione..."
                  :
                  "🗑️ Elimina tenda"
                }


              </button>







            </div>



          ))

        }




      </div>






    </main>


  );


}