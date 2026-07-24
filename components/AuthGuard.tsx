"use client";


import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";



export default function AuthGuard({

  children

}:{

  children:React.ReactNode

}){


  const router = useRouter();


  const [checking,setChecking]=useState(true);




  useEffect(()=>{


    async function checkAuth(){



      const {

        data:{
          session

        }

      } = await supabase.auth.getSession();





      if(!session){


        router.push("/login");

        return;


      }




      setChecking(false);


    }




    checkAuth();



  },[]);






  if(checking){


    return (

      <main className="p-6">

        Caricamento...

      </main>

    );


  }







  return children;


}