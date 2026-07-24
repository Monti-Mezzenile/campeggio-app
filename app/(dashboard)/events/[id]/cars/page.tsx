"use client";


import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import BackButton from "@/components/ui/BackButton";




export default function CarsEventPage(){


  const params = useParams();

  const router = useRouter();


  const id = params.id as string;



  const [cars,setCars] = useState<any[]>([]);

  const [loading,setLoading] = useState(true);








  async function getOrCreateTrip(){


    let {data:trip}=await supabase

      .from("trips")

      .select("id")

      .eq("event_id",id)

      .maybeSingle();





    if(!trip){


      const {data:newTrip,error}=await supabase

        .from("trips")

        .insert({

          event_id:id,

          tipo:"andata"

        })

        .select()

        .single();



      if(error){

        console.log(error);

        return null;

      }



      trip=newTrip;


    }



    return trip;


  }









  async function loadCars(){



    setLoading(true);





    const trip = await getOrCreateTrip();





    if(!trip){


      setLoading(false);

      return;


    }








    const {data:tripCars,error}=await supabase

      .from("trip_cars")

      .select("*")

      .eq("trip_id",trip.id);







    if(error){

      console.log(error);

      setLoading(false);

      return;

    }







    const result = await Promise.all(



      (tripCars || []).map(async(car:any)=>{





        const {data:carData}=await supabase

          .from("cars")

          .select("*")

          .eq("id",car.car_id)

          .single();







        const {data:driver}=await supabase

          .from("profiles")

          .select("*")

          .eq("id",car.driver_id)

          .single();








        const {data:passengers}=await supabase

          .from("trip_passengers")

          .select("id,user_id")

          .eq("trip_car_id",car.id);








        let passengerProfiles:any[]=[];







        if(passengers && passengers.length){



          const ids=passengers.map(

            p=>p.user_id

          );





          const {data:profiles}=await supabase

            .from("profiles")

            .select("*")

            .in("id",ids);





          passengerProfiles = passengers.map((passenger:any)=>{


            const profile = (profiles || []).find(

              p=>p.id===passenger.user_id

            );


            return {

              ...profile,

              passengerId:passenger.id

            };


          });



        }









        return {


          ...car,

          carData,

          driver,

          passengers:passengerProfiles


        };





      })



    );






    setCars(result);

    setLoading(false);



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



      <BackButton label="Evento" />




      <h1 className="
        text-3xl
        font-bold
        mb-6
      ">

        🚗 Auto

      </h1>








      <button

        onClick={()=>router.push(`/events/${id}/cars/add`)}

        className="
          w-full
          bg-black
          text-white
          rounded-2xl
          p-4
          mb-6
        "

      >

        ➕ Aggiungi auto


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


          Nessuna auto aggiunta


        </div>


      }









      <div className="
        flex
        flex-col
        gap-4
      ">



        {

          cars.map((item)=>(



            <div

              key={item.id}

              className="
                bg-white
                border
                rounded-2xl
                p-5
              "

            >


              {
                item.carData?.foto &&

                <img

                  src={item.carData.foto}

                  alt={item.carData.modello}

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

                🚙 {item.carData?.modello}

              </h2>






              <p className="mt-2">

                👤 Guidatore:

                <b>

                  {" "}

                  {item.driver?.nome || "Utente"}

                </b>


              </p>







              <p className="mt-2">

                🪑 Posti totali:

                <b>

                  {" "}

                  {item.posti_disponibili + 1}

                </b>


              </p>








              <p className="mt-2">

                👥 Occupati:

                <b>

                  {" "}

                  {item.passengers.length + 1}/{item.posti_disponibili + 1}

                </b>


              </p>







              <p className="
                mt-4
                font-semibold
              ">

                👥 Passeggeri

              </p>







              {

                item.passengers.length===0

                ?

                <p className="text-gray-500 mt-2">

                  Nessun passeggero assegnato

                </p>


                :



                <ul className="mt-2">

                  {

                    item.passengers.map((p:any)=>(


                      <li key={p.passengerId}>

                        👤 {p.nome}

                      </li>


                    ))

                  }


                </ul>


              }








              <button

                onClick={()=>router.push(`/events/${id}/cars/${item.id}`)}

                className="
                  mt-5
                  w-full
                  border
                  rounded-xl
                  p-3
                "

              >

                Gestisci auto


              </button>







            </div>


          ))



        }




      </div>






    </main>

  );


}