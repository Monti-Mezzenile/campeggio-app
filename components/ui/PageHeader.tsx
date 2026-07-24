"use client";

import { useRouter } from "next/navigation";


interface PageHeaderProps {

  title: string;

  subtitle?: string;

  back?: boolean;

}



export default function PageHeader({

  title,

  subtitle,

  back = true,

}: PageHeaderProps) {


  const router = useRouter();



  return (

    <div className="mb-6">


      {
        back &&

        <button

          onClick={()=>router.back()}

          className="
            text-sm
            text-gray-500
            mb-3
          "

        >

          ← Indietro

        </button>

      }



      <h1

        className="
          text-3xl
          font-bold
          tracking-tight
        "

      >

        {title}

      </h1>



      {
        subtitle &&

        <p

          className="
            text-gray-500
            mt-2
          "

        >

          {subtitle}

        </p>

      }


    </div>

  );

}