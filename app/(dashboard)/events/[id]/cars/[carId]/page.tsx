"use client";


import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import BackButton from "@/components/ui/BackButton";





export default function CarDetailPage(){


  const params = useParams();

  const router = useRouter();


  const eventId = params.id as string;

  const carId = params.carId as string;





  const [car,setCar] = useState<any>(null);

  const [driver,setDriver] = useState<any>(null);

  const [passengers,setPassengers] = useState<any[]>([]);

  const [loading,setLoading] = useState(true);









  async function loadCar(){



    setLoading(true);





    const {data:tripCar,error}=await supabase

      .from("trip_cars")

      .select("*")

      .eq("id",carId)

      .single();







    if(error){

      console.log(error);

      setLoading(false);

      return;

    }









    const {data:carData}=await supabase

      .from("cars")

      .select("*")

      .eq("id",tripCar.car_id)

      .single();








    const {data:driverData}=await supabase

      .from("profiles")

      .select("*")

      .eq("id",tripCar.driver_id)

      .single();







    setCar({

      ...tripCar,

      ...carData

    });




    setDriver(driverData);









    const {data:passengersData}=await supabase

      .from("trip_passengers")

      .select("id,user_id")

      .eq("trip_car_id",carId);







    if(passengersData && passengersData.length){



      const ids = passengersData.map(

        p=>p.user_id

      );







      const {data:profiles}=await supabase

        .from("profiles")

        .select("*")

        .in("id",ids);







      const formatted = passengersData.map((p:any)=>{


        const profile = (profiles || []).find(

          (user:any)=>user.id===p.user_id

        );


        return {

          ...profile,

          passengerId:p.id

        };


      });






      setPassengers(formatted);



    }

    else{


      setPassengers([]);


    }







    setLoading(false);


  }









  async function removePassenger(id:string){



    const ok = confirm(

      "Rimuovere questa persona dall'auto?"

    );




    if(!ok){

      return;

    }






    const {error}=await supabase

      .from("trip_passengers")

      .delete()

      .eq("id",id);







    if(error){

      alert(error.message);

      return;

    }






    loadCar();


  }









  async function removeCar(){



    const ok = confirm(

      "Rimuovere questa auto dall'evento?"

    );






    if(!ok){

      return;

    }







    const {error}=await supabase

      .from("trip_cars")

      .delete()

      .eq("id",carId);







    if(error){

      alert(error.message);

      return;

    }







    router.push(

      `/events/${eventId}/cars`

    );


  }









  useEffect(()=>{


    if(carId){

      loadCar();

    }


  },[carId]);









  if(loading){



    return (

      <main className="p-6">

        Caricamento auto...

      </main>

    );


  }








  if(!car){



    return (

      <main className="p-6">

        Auto non trovata

      </main>

    );


  }









  const postiTotali = car.posti_disponibili + 1;

  const occupati = passengers.length + 1;

  const liberi = postiTotali - occupati;









  return (

    <main className="
      p-6
      pb-32
      max-w-3xl
      mx-auto
    ">



      <BackButton label="Auto" />

{
  car?.foto &&

  <img

    src={car.foto}

    alt={car.modello}

    className="
      w-full
      h-52
      object-contain
      rounded-2xl
      mb-6
    "

  />

}



      <h1 className="
        text-3xl
        font-bold
        mb-6
      ">

        🚙 {car.modello}

      </h1>









      <div className="
        bg-white
        border
        rounded-2xl
        p-5
      ">



        <p>

          🪑 Posti totali:

          <b>

            {" "}

            {postiTotali}

          </b>

        </p>





        <p className="mt-3">

          👥 Occupati:

          <b>

            {" "}

            {occupati}/{postiTotali}

          </b>

        </p>





        <p className="mt-3">

          ✅ Liberi:

          <b>

            {" "}

            {liberi}

          </b>

        </p>




      </div>









      <section className="mt-8">


        <h2 className="
          text-xl
          font-bold
          mb-4
        ">

          👑 Guidatore

        </h2>





        {
          driver &&


          <PersonCard

            person={driver}

            owner

          />


        }



      </section>









      <section className="mt-8">


        <h2 className="
          text-xl
          font-bold
          mb-4
        ">

          👥 Passeggeri

        </h2>






        {
          passengers.length===0 &&


          <p className="text-gray-500">

            Nessun passeggero assegnato

          </p>


        }








        <div className="
          flex
          flex-col
          gap-3
        ">



          {
            passengers.map((person)=>(


              <PersonCard

                key={person.passengerId}

                person={person}

                removePassenger={removePassenger}

              />


            ))

          }



        </div>






      </section>








      <button

        onClick={()=>router.push(
          `/events/${eventId}/cars/${carId}/add-passenger`
        )}

        className="
          mt-8
          w-full
          bg-black
          text-white
          rounded-xl
          p-4
        "

      >

        ➕ Aggiungi passeggero

      </button>








      <button

        onClick={removeCar}

        className="
          mt-4
          w-full
          bg-red-600
          text-white
          rounded-xl
          p-4
        "

      >

        🗑️ Rimuovi auto dall'evento

      </button>






    </main>

  );

}









function PersonCard({

  person,

  owner=false,

  removePassenger

}:any){



  return (

    <div className="
      flex
      items-center
      justify-between
      bg-white
      border
      rounded-2xl
      p-4
    ">



      <div className="
        flex
        items-center
        gap-4
      ">



        {
          person?.avatar_url

          ?

          <img

            src={person.avatar_url}

            className="
              w-12
              h-12
              rounded-full
              object-cover
            "

          />

          :

          <div className="
            w-12
            h-12
            rounded-full
            bg-gray-200
            flex
            items-center
            justify-center
          ">

            👤

          </div>

        }






        <div>

          <p className="font-bold">

            {person?.nome}

          </p>



          {
            owner &&


            <p className="text-gray-500 text-sm">

              Guidatore

            </p>


          }



        </div>



      </div>







      {
        !owner &&


        <button

          onClick={()=>removePassenger(person.passengerId)}

          className="
            text-red-600
            text-xl
          "

        >

          🗑️

        </button>


      }



    </div>

  );

}