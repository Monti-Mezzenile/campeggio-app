"use client";

import { useRouter } from "next/navigation";


export default function BookockPage(){


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
        bg-blue-50
        rounded-3xl
        p-6
      ">



        <div className="text-6xl mb-4">

          🎲

        </div>



        <h1 className="
          text-3xl
          font-bold
          mb-4
        ">

          Bookock

        </h1>





        <p className="
          text-gray-600
          leading-relaxed
        ">

          Qui verranno inserite le regole
          del gioco Bookock.

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
          mb-3
        ">

          📖 Regole

        </h2>



        <p className="
          whitespace-pre-line
          text-gray-700
        ">

          Inseriremo qui il regolamento completo.

        </p>



      </section>





    </main>

  );


}