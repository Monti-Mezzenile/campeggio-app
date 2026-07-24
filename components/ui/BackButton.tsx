"use client";


import { useRouter } from "next/navigation";





export default function BackButton({

  label="Indietro"

}:{

  label?:string

}){



  const router = useRouter();







  return (



    <button



      onClick={()=>router.back()}



      className="
        mb-5
        flex
        items-center
        gap-2
        text-sm
        text-gray-600
      "



    >



      ← {label}



    </button>



  );



}