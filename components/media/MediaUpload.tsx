"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase";



export default function MediaUpload({

  eventId,

  userId,

  reload


}:{

  eventId:string;

  userId:string;

  reload:()=>void;

}){


  const [uploading,setUploading]=useState(false);

  const [message,setMessage]=useState("");







  async function uploadFiles(

    e:React.ChangeEvent<HTMLInputElement>

  ){


    const files=e.target.files;



    if(!files || files.length===0){

      return;

    }






    setUploading(true);

    setMessage("");







    try{



      for(const file of Array.from(files)){



        const tipo =

          file.type.startsWith("video")

          ?

          "video"

          :

          "foto";






        const extension =

          file.name.split(".").pop();






        const fileName =

          `${crypto.randomUUID()}.${extension}`;







        const path =

          `${eventId}/${fileName}`;









        const {

          error:uploadError

        } = await supabase.storage

          .from("event-media")

          .upload(

            path,

            file

          );







        if(uploadError){

          throw uploadError;

        }









        const {

          error:dbError

        } = await supabase

          .from("media")

          .insert({

            event_id:eventId,

            user_id:userId,

            tipo,

            url:path,

            nome_file:file.name

          });







        if(dbError){

          throw dbError;

        }





      }







      setMessage(

        "✅ Caricamento completato"

      );



      reload();





    }

    catch(error:any){


      console.log(error);



      setMessage(

        "❌ Errore: " + error.message

      );


    }

    finally{


      setUploading(false);


      e.target.value="";


    }


  }









  return (

    <div>


      <label

        className="
          block
          w-full
          bg-black
          text-white
          text-center
          rounded-xl
          p-4
          cursor-pointer
          font-semibold
        "

      >


        {


          uploading

          ?

          "⏳ Caricamento..."

          :

          "📸 Carica foto/video"


        }





        <input

          type="file"

          accept="image/*,video/*"

          multiple

          onChange={uploadFiles}

          className="hidden"

        />



      </label>







      {


        message &&


        <p className="
          mt-3
          text-center
          text-sm
        ">


          {message}


        </p>


      }



    </div>

  );


}