"use client";


import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import BackButton from "@/components/ui/BackButton";




export default function AddEventCarPage(){


  const params = useParams();

  const router = useRouter();


  const id = params.id as string;



  const [cars,setCars] = useState<any[]>([]);

  const [loading,setLoading] = useState(true);

  const [addingCarId,setAddingCarId] = useState<string | null>(null);









  async function getOrCreateTrip(){



    const {data:existingTrip,error:findError}=await supabase

      .from("trips")

      .select("*")

      .eq("event_id",id)

      .maybeSingle();





    if(findError){

      console.log(findError);

      alert(findError.message);

      return null;

    }







    if(existingTrip){

      return existingTrip;

    }








    const {data:newTrip,error:createError}=await supabase

      .from("trips")

      .insert({

        event_id:id

      })

      .select()

      .single();







    if(createError){

      console.log(createError);

      alert(createError.message);

      return null;

    }







    return newTrip;


  }









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

    }







    setCars(data || []);

    setLoading(false);



  }









  async function addCar(car:any){



    if(addingCarId){

      return;

    }





    setAddingCarId(car.id);








    const {

      data:{
        user

      }

    } = await supabase.auth.getUser();








    if(!user){

      setAddingCarId(null);

      return;

    }








    const trip = await getOrCreateTrip();








    if(!trip){

      setAddingCarId(null);

      return;

    }









    const {data:already}=await supabase

      .from("trip_cars")

      .select("id")

      .eq("trip_id",trip.id)

      .eq("car_id",car.id)

      .maybeSingle();








    if(already){


      alert("Questa auto è già presente nell'evento");

      setAddingCarId(null);

      return;


    }









    const postiDisponibili = Math.max(

      (car.posti_totali || 1)-1,

      0

    );








    const {error}=await supabase

      .from("trip_cars")

      .insert({

        trip_id:trip.id,

        car_id:car.id,

        driver_id:user.id,

        posti_disponibili:postiDisponibili

      });








    if(error){

      console.log(error);

      alert(error.message);

      setAddingCarId(null);

      return;

    }








    router.push(`/events/${id}/cars`);



  }









  useEffect(()=>{


    if(id){

      loadCars();

    }


  },[id]);









  if(loading){

    return (

      <main className="p-6">

        Caricamento auto...

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



      <BackButton label="Auto evento" />





      <h1 className="
        text-3xl
        font-bold
        mb-6
      ">

        🚗 Scegli mezzo

      </h1>








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

                🚙 {car.modello}

              </h2>





              <p className="mt-3">

                👥 Posti:

                <b>

                  {" "}{car.posti_totali}

                </b>

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








              <button

                disabled={addingCarId === car.id}

                onClick={()=>addCar(car)}

                className="
                  mt-5
                  w-full
                  bg-black
                  text-white
                  rounded-xl
                  p-3
                  disabled:opacity-50
                "

              >

                {

                  addingCarId === car.id

                  ?

                  "Aggiunta..."

                  :

                  "➕ Porta questa auto"

                }


              </button>


            </div>


          ))

        }



      </div>






    </main>

  );


}