"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";



export default function MediaGrid({

  eventId,

  reloadKey


}:{

  eventId:string;

  reloadKey:number;

}){


  const [media,setMedia]=useState<any[]>([]);

  const [loading,setLoading]=useState(true);

  const [user,setUser]=useState<any>(null);

  const [isAdmin,setIsAdmin]=useState(false);







  async function loadUser(){


    const {

      data:{
        user

      }

    } = await supabase.auth.getUser();



    setUser(user);



    if(user){



      const {data:profile}=await supabase

        .from("profiles")

        .select("ruolo")

        .eq("id",user.id)

        .single();





      setIsAdmin(

        profile?.ruolo==="admin"

      );



    }


  }








  async function loadMedia(){


    setLoading(true);




    const {data,error}=await supabase

      .from("media")

      .select(`

        *,

        profiles:user_id(

          nome

        )

      `)

      .eq(

        "event_id",

        eventId

      )

      .order(

        "created_at",

        {

          ascending:false

        }

      );





    if(error){

      console.log(

        "ERRORE MEDIA:",

        error

      );

      setLoading(false);

      return;

    }






    const withUrls = await Promise.all(

      (data || []).map(async(item)=>{



        const {

          data:signed

        } = await supabase.storage

          .from("event-media")

          .createSignedUrl(

            item.url,

            60*60

          );





        return {

          ...item,

          signedUrl:signed?.signedUrl

        };



      })

    );





    setMedia(withUrls);

    setLoading(false);



  }









  async function deleteMedia(item:any){



    const ok=confirm(

      "Eliminare questo file?"

    );



    if(!ok){

      return;

    }







    const {

      error:storageError

    } = await supabase.storage

      .from("event-media")

      .remove([

        item.url

      ]);






    if(storageError){

      alert(storageError.message);

      return;

    }






    const {

      error:dbError

    } = await supabase

      .from("media")

      .delete()

      .eq(

        "id",

        item.id

      );






    if(dbError){

      alert(dbError.message);

      return;

    }






    loadMedia();



  }








  useEffect(()=>{


    if(eventId){

      loadUser();

      loadMedia();

    }


  },[eventId,reloadKey]);









  if(loading){

    return (

      <p className="text-center">

        Caricamento ricordi...

      </p>

    );

  }








  if(media.length===0){

    return (

      <div className="
        bg-white
        border
        rounded-xl
        p-5
        text-center
        text-gray-500
      ">

        Nessuna foto o video ancora 📸

      </div>

    );

  }









  return (

    <div className="
      grid
      grid-cols-3
      gap-2
    ">


      {


        media.map(item=>(


          <div

            key={item.id}

            className="
              aspect-square
              rounded-xl
              overflow-hidden
              bg-gray-100
              relative
            "

          >




            {


              item.tipo==="foto"


              ?


              <img

                src={item.signedUrl}

                alt={item.nome_file}

                className="
                  w-full
                  h-full
                  object-cover
                "

              />



              :



              <video

                src={item.signedUrl}

                controls

                className="
                  w-full
                  h-full
                  object-cover
                "

              />

            }






            {


              (

                user?.id===item.user_id

                ||

                isAdmin

              )

              &&


              <button

                onClick={()=>deleteMedia(item)}

                className="
                  absolute
                  top-2
                  right-2
                  bg-red-500
                  text-white
                  rounded-full
                  w-8
                  h-8
                  flex
                  items-center
                  justify-center
                "

              >

                🗑️

              </button>


            }







          </div>


        ))

      }



    </div>


  );


}