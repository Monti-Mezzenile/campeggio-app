"use client";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";



export default function CuriositaPage(){


  const router = useRouter();


  const [curiosita,setCuriosita] = useState<any[]>([]);

  const [loading,setLoading] = useState(true);







  async function loadCuriosita(){


    const {

      data,

      error

    } = await supabase

      .from("curiosities")

      .select("*")

      .eq(

        "tipo",

        "community"

      )

      .order(

        "created_at",

        {

          ascending:false

        }

      );





    if(error){

      console.log(error);

      return;

    }





    setCuriosita(

      data || []

    );


    setLoading(false);



  }








  useEffect(()=>{


    loadCuriosita();


  },[]);










  async function deleteCuriosita(item:any){



    const conferma = confirm(

      "Eliminare questa curiosità?"

    );





    if(!conferma){

      return;

    }








    // elimina file immagine

    if(item.immagine_url){


      const path = item.immagine_url

        .split("/curiosities/")[1];



      if(path){


        await supabase.storage

          .from("curiosities")

          .remove([path]);


      }


    }







    // elimina audio

    if(item.audio_url){


      const path = item.audio_url

        .split("/curiosities/")[1];



      if(path){


        await supabase.storage

          .from("curiosities")

          .remove([path]);


      }


    }








    // elimina record

    const {

      error

    } = await supabase

      .from("curiosities")

      .delete()

      .eq(

        "id",

        item.id

      );






    if(error){

      alert(error.message);

      return;

    }






    loadCuriosita();


  }









  const ufficiali=[


    {

      titolo:"Storia di Monti",

      icona:"🏕️",

      link:"/curiosita/storia-monti",

      colore:"bg-green-50"

    },


    {

      titolo:"La corsa dei cavalli",

      icona:"🐎",

      link:"/curiosita/corsa-dei-cavalli",

      colore:"bg-yellow-50"

    },


    {

      titolo:"Bookock",

      icona:"🎲",

      link:"/curiosita/bookock",

      colore:"bg-blue-50"

    },


    {

      titolo:"Cavallo",

      icona:"🐴",

      link:"/curiosita/cavallo",

      colore:"bg-orange-50"

    }


  ];









  if(loading){


    return (

      <main className="p-6">

        Caricamento curiosità...

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

        📚 Curiosità

      </h1>







      <div className="
        grid
        grid-cols-2
        gap-4
      ">



        {


          ufficiali.map((item)=>(


            <button

              key={item.titolo}

              onClick={()=>router.push(item.link)}

              className={`
                aspect-square
                rounded-3xl
                ${item.colore}
                flex
                flex-col
                items-center
                justify-center
                active:scale-95
                transition
              `}

            >

              <span className="text-5xl">

                {item.icona}

              </span>



              <span className="
                mt-4
                font-semibold
                text-center
              ">

                {item.titolo}

              </span>


            </button>


          ))

        }


      </div>









      {

        curiosita.length > 0 && (


          <section className="mt-8">


            <h2 className="
              text-xl
              font-bold
              mb-4
            ">

              ✨ Curiosità della community

            </h2>






            <div className="
              grid
              grid-cols-2
              gap-4
            ">



              {


                curiosita.map((item)=>(



                  <div

                    key={item.id}

                    className="
                      relative
                    "

                  >





                    <button

                      onClick={()=>router.push(
                        `/curiosita/${item.id}`
                      )}

                      className="
                        aspect-square
                        w-full
                        rounded-3xl
                        bg-purple-50
                        flex
                        flex-col
                        items-center
                        justify-center
                        active:scale-95
                        transition
                      "

                    >



                      {


                        item.immagine_url


                        ?

                        <img

                          src={item.immagine_url}

                          className="
                            w-20
                            h-20
                            rounded-2xl
                            object-cover
                          "

                        />


                        :


                        <span className="text-5xl">

                          {item.icona || "📚"}

                        </span>


                      }





                      <span className="
                        mt-3
                        font-semibold
                        text-center
                        px-2
                      ">

                        {item.titolo}

                      </span>



                    </button>








                    <button

                      onClick={()=>deleteCuriosita(item)}

                      className="
                        absolute
                        top-2
                        right-2
                        w-8
                        h-8
                        rounded-full
                        bg-white
                        shadow
                        text-red-500
                      "

                    >

                      🗑️


                    </button>






                  </div>



                ))



              }




            </div>




          </section>


        )


      }









      <button

        onClick={()=>router.push(
          "/curiosita/nuova"
        )}

        className="
          mt-8
          w-full
          rounded-3xl
          bg-purple-100
          p-6
          font-bold
          text-lg
          active:scale-95
          transition
        "

      >

        ➕ Aggiungi curiosità


      </button>







    </main>


  );


}