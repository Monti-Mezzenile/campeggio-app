"use client";

import { useRouter } from "next/navigation";


export default function Curiosity(){


  const router = useRouter();





  return (

    <section className="
      mt-6
    ">



      <button

        onClick={()=>router.push("/curiosities")}

        className="
          w-full
          rounded-3xl
          bg-purple-50
          p-6
          flex
          items-center
          gap-5
          active:scale-95
          transition
        "

      >





        <div className="
          w-16
          h-16
          rounded-2xl
          bg-white
          flex
          items-center
          justify-center
          text-4xl
        ">

          📚

        </div>







        <div className="text-left">


          <h2 className="
            text-xl
            font-bold
          ">

            Curiosità

          </h2>





          <p className="
            text-gray-500
            mt-1
          ">

            Giochi, storia e tradizioni di Monti

          </p>



        </div>






      </button>





    </section>

  );


}