"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import MediaUpload from "@/components/media/MediaUpload";
import MediaGrid from "@/components/media/MediaGrid";



export default function MediaSection({

  eventId


}:{

  eventId:string;

}){


  const [user,setUser]=useState<any>(null);

  const [reloadKey,setReloadKey]=useState(0);

  const [loading,setLoading]=useState(true);







  async function loadUser(){


    const {

      data:{
        user

      }

    } = await supabase.auth.getUser();



    setUser(user);

    setLoading(false);


  }







  useEffect(()=>{


    loadUser();


  },[]);







  function reload(){


    setReloadKey(

      value=>value+1

    );


  }







  if(loading){

    return (

      <p>

        Caricamento...

      </p>

    );

  }







  return (

    <div className="
      flex
      flex-col
      gap-5
    ">




      <div className="
        bg-white
        border
        rounded-2xl
        p-5
      ">


        <h2 className="
          text-xl
          font-bold
          mb-4
        ">

          📸 Foto e Video

        </h2>




        {


          user &&


          <MediaUpload

            eventId={eventId}

            userId={user.id}

            reload={reload}

          />


        }


      </div>






      <div className="
        bg-white
        border
        rounded-2xl
        p-5
      ">


        <MediaGrid

          eventId={eventId}

          reloadKey={reloadKey}

        />


      </div>




    </div>

  );


}