"use client";

import { useRouter } from "next/navigation";


export default function StoriaMontiPage(){


  const router = useRouter();



  return (

    <main className="
      p-6
      pb-28
      max-w-3xl
      mx-auto
    ">



      <button

        onClick={()=>router.back()}

        className="
          mb-6
          text-gray-500
        "

      >

        ← Indietro

      </button>







      <section className="
        bg-green-50
        rounded-3xl
        p-6
      ">



        <div className="text-6xl mb-4">

          🏕️

        </div>





        <h1 className="
          text-3xl
          font-bold
          mb-4
        ">

          La storia di Monti

        </h1>





        <p className="
          text-gray-600
          leading-relaxed
        ">

          Qui racconteremo la nascita di Monti,
          i primi campeggi e tutti i momenti
          che hanno creato questa tradizione.

        </p>




      </section>







      <section className="
        mt-6
        bg-white
        rounded-3xl
        p-6
        border
      ">



        <h2 className="
          text-xl
          font-bold
        ">

          📜 Storia

        </h2>





        <p className="
          mt-3
          whitespace-pre-line
        ">

          Inseriremo qui il racconto.

        </p>



      </section>





    </main>

  );


}