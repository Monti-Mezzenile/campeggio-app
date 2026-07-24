// app/profile/cars/page.tsx

"use client";


import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import BackButton from "@/components/ui/BackButton";



export default function CarsPage(){


  const router = useRouter();


  const [cars,setCars] = useState<any[]>([]);

  const [loading,setLoading] = useState(true);








  async function loadCars(){



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


      .from("cars")


      .select("*")


      .eq("user_id",user.id)


      .order("id",{

        ascending:false

      });








    if(error){


      console.log(error);


      setLoading(false);


      return;


    }







    setCars(data || []);


    setLoading(false);



  }









  useEffect(()=>{


    loadCars();


  },[]);









  if(loading){


    return (

      <main className="p-6">

        Caricamento mezzi...

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

        🚗 I miei mezzi

      </h1>









      <button


        onClick={()=>router.push("/profile/cars/new")}


        className="
          w-full
          bg-black
          text-white
          rounded-2xl
          p-4
          mb-6
        "


      >

        ➕ Aggiungi mezzo


      </button>









      {

        cars.length===0 &&



        <div className="
          bg-white
          border
          rounded-2xl
          p-6
          text-center
        ">


          <p>

            Non hai ancora aggiunto nessun mezzo.

          </p>



        </div>


      }









      <div className="
        flex
        flex-col
        gap-4
      ">








        {

          cars.map((car)=>(



            <div

              key={car.id}

              className="
                bg-white
                border
                rounded-2xl
                p-5
              "

            >



{
  car.foto &&

  <img

    src={car.foto}

    alt={car.modello}

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


                🚗 {car.modello}


              </h2>








              <p className="
                mt-3
              ">


                👥 {car.posti_totali} posti disponibili


              </p>









              {

                car.partenza_predefinita &&



                <p className="
                  text-gray-500
                  mt-2
                ">


                  📍 {car.partenza_predefinita}


                </p>


              }









              {

                car.note &&



                <p className="
                  text-gray-500
                  mt-2
                ">


                  📝 {car.note}


                </p>


              }








              <button


                onClick={()=>router.push(`/profile/cars/${car.id}`)}


                className="
                  mt-5
                  w-full
                  border
                  rounded-xl
                  p-3
                "


              >

                Gestisci mezzo


              </button>






            </div>


          ))


        }







      </div>






    </main>


  );

}