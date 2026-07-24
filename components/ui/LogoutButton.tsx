"use client";


import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";



export default function LogoutButton(){


  const router = useRouter();




  async function logout(){


    const {error}=await supabase.auth.signOut();



    if(error){

      console.log(error);

      alert("Errore durante il logout");

      return;

    }




    router.push("/login");

    router.refresh();


  }





  return (

    <button

      onClick={logout}

      className="
        w-full
        bg-red-500
        text-white
        rounded-xl
        p-3
        font-semibold
      "

    >

      🐇 Ciao coniglietto

    </button>

  );


}