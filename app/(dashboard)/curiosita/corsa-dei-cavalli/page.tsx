"use client";

import { useRouter } from "next/navigation";


export default function CorsaDeiCavalliPage(){


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
        bg-yellow-50
        rounded-3xl
        p-6
      ">



        <div className="
          text-6xl
          mb-4
        ">

          🐎

        </div>





        <h1 className="
          text-3xl
          font-bold
          mb-4
        ">

          La corsa dei cavalli

        </h1>






        <p className="
          text-gray-600
          leading-relaxed
        ">

          Qui verranno inserite le regole del gioco
          della corsa dei cavalli.

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

          🎲 Regole

        </h2>






        <p className="
          text-gray-700
          whitespace-pre-line
        ">

          Inseriremo qui tutte le regole del gioco.


        </p>




      </section>







      <section className="
        mt-6
        bg-purple-50
        rounded-3xl
        p-6
      ">



        <h2 className="
          text-xl
          font-bold
          mb-3
        ">

          🎵 Audio regolamento

        </h2>





        <audio

          controls

          className="w-full"

        >

          <source

            src="/audio/corsa-dei-cavalli.mp3"

            type="audio/mpeg"

          />


          Il tuo browser non supporta l'audio.


        </audio>




      </section>






    </main>


  );


}