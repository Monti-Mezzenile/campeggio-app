"use client";


import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import BackButton from "@/components/ui/BackButton";





export default function AddPassengerPage(){


  const params = useParams();

  const router = useRouter();


  const eventId = params.id as string;

  const carId = params.carId as string;





  const [users,setUsers] = useState<any[]>([]);

  const [existing,setExisting] = useState<string[]>([]);

  const [driver,setDriver] = useState<string>("");

  const [loading,setLoading] = useState(true);

  const [adding,setAdding] = useState(false);









  async function loadData(){



    setLoading(true);






    const {data:tripCar}=await supabase

      .from("trip_cars")

      .select("*")

      .eq("id",carId)

      .single();







    if(!tripCar){

      setLoading(false);

      return;

    }







    setDriver(tripCar.driver_id);








    const {data:members}=await supabase

      .from("event_members")

      .select("user_id")

      .eq("event_id",eventId)

      .eq("stato","partecipo");








    const ids=(members || [])

      .map((m:any)=>m.user_id);








    const {data:passengers}=await supabase

      .from("trip_passengers")

      .select("user_id")

      .eq("trip_car_id",carId);








    setExisting(

      (passengers || [])

      .map((p:any)=>p.user_id)

    );








    const {data:profiles}=await supabase

      .from("profiles")

      .select("*")

      .in("id",ids);








    setUsers(

      (profiles || [])

      .filter(

        (user:any)=>

          user.id !== tripCar.driver_id

      )

    );







    setLoading(false);



  }









  async function addPassenger(userId:string){



    if(adding){

      return;

    }






    setAdding(true);







    const {error}=await supabase

      .from("trip_passengers")

      .insert({

        trip_car_id:carId,

        user_id:userId

      });







    if(error){

      alert(error.message);

      setAdding(false);

      return;

    }







    router.push(

      `/events/${eventId}/cars/${carId}`

    );


  }









  useEffect(()=>{


    if(carId){

      loadData();

    }


  },[carId]);









  if(loading){



    return (

      <main className="p-6">

        Caricamento persone...

      </main>

    );

  }









  return (

    <main className="
      p-6
      pb-28
      max-width-3xl
      mx-auto
    ">



      <BackButton label="Gestisci auto" />






      <h1 className="
        text-3xl
        font-bold
        mb-6
      ">

        👥 Aggiungi passeggero

      </h1>









      {
        users.length===0 &&


        <div className="
          bg-white
          border
          rounded-2xl
          p-6
          text-center
        ">


          Nessuna persona disponibile


        </div>


      }








      <div className="
        flex
        flex-col
        gap-4
      ">





        {
          users.map((user)=>(



            <div

              key={user.id}

              className="
                bg-white
                border
                rounded-2xl
                p-4
                flex
                items-center
                justify-between
              "

            >






              <div className="
                flex
                items-center
                gap-3
              ">



                {
                  user.avatar_url &&


                  <img

                    src={user.avatar_url}

                    className="
                      w-12
                      h-12
                      rounded-full
                      object-cover
                    "

                  />

                }





                <div>

                  <p className="font-bold">

                    {user.nome}

                  </p>

                </div>


              </div>








              {
                existing.includes(user.id)

                ?

                <span className="text-gray-500">

                  Già assegnato

                </span>


                :


                <button

                  disabled={adding}

                  onClick={()=>addPassenger(user.id)}

                  className="
                    bg-black
                    text-white
                    rounded-xl
                    px-4
                    py-2
                  "

                >

                  ➕

                </button>


              }





            </div>



          ))

        }





      </div>






    </main>


  );

}