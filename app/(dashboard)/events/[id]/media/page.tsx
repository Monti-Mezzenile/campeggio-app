"use client";


import { useParams } from "next/navigation";

import BackButton from "@/components/ui/BackButton";

import MediaSection from "@/components/media/MediaSection";



export default function MediaPage(){


  const params = useParams();


  const eventId = params.id as string;



  return (

    <main className="
      p-6
      pb-28
      max-w-3xl
      mx-auto
    ">


      <BackButton label="Evento"/>



      <h1 className="
        text-3xl
        font-bold
        mb-6
      ">

        📸 Foto e Video

      </h1>




      <MediaSection

        eventId={eventId}

      />



    </main>

  );


}