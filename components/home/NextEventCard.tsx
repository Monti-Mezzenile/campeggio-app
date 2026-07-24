"use client";


import Link from "next/link";

import Card from "@/components/ui/Card";



interface NextEventCardProps {


  event:any;

  daysLeft:number | null;


}



export default function NextEventCard({

  event,

  daysLeft


}:NextEventCardProps){



  if(!event){

    return null;

  }



  return (


    <Link href={`/events/${event.id}`}>


      <Card>



        <div className="
          text-center
        ">




          <p className="
            text-sm
            text-gray-500
          ">

            🔥 MONTI SI AVVICINA

          </p>





          {


            daysLeft !== null && (


              <>


                <p className="
                  text-5xl
                  font-bold
                  mt-2
                ">

                  {daysLeft}

                </p>



                <p className="
                  text-gray-500
                  mb-6
                ">

                  giorni

                </p>


              </>


            )


          }





          <h2 className="
            text-xl
            font-bold
          ">

            🏕️ {event.titolo}

          </h2>






          <p className="
            text-gray-500
            mt-3
          ">

            📍 {event.luogo}

          </p>






          <p className="
            text-gray-500
          ">

            📅 {event.data_inizio || event.data_evento}

          </p>





          {


            event.participation && (


              <p className="
                mt-3
                font-semibold
              ">


                {


                  event.participation === "partecipo"

                  ?

                  "🟢 Partecipo"


                  :


                  event.participation === "forse"

                  ?

                  "🟡 Forse"


                  :


                  "🔴 Non partecipo"


                }


              </p>


            )


          }





        </div>



      </Card>



    </Link>


  );


}