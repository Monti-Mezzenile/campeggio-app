"use client";


import Link from "next/link";

import { useRouter } from "next/navigation";

import Card from "@/components/ui/Card";

import EmptyState from "@/components/ui/EmptyState";



interface MyEventsProps {


  events:any[];

  isAdmin:boolean;


}



export default function MyEvents({

  events,

  isAdmin


}:MyEventsProps){



  const router = useRouter();



  return (


    <section className="mt-6">





      <div className="
        flex
        justify-between
        items-center
        mb-3
      ">



        <h2 className="
          text-xs
          font-bold
          uppercase
          tracking-widest
          text-[#FFF4E3]
        ">

          I MIEI EVENTI

        </h2>






        {


          isAdmin && (


            <Link href="/events/new">


              <span className="
                text-xs
                font-bold
                uppercase
                tracking-wide
                text-[#FFF4E3]
              ">

                + CREA

              </span>


            </Link>


          )


        }



      </div>








      {


        events.length === 0 ?



        <EmptyState

          icon="🏕️"

          title="Nessun evento"

          description="Crea il tuo primo campeggio con gli amici"

        />



        :



        <div
          className="
            flex
            gap-3
            overflow-x-auto
            pb-2
            scrollbar-hide
            snap-x
          "
        >



          {


            events.slice(0,5).map(event=>(



              <Link


                key={event.id}


                href={`/events/${event.id}`}


                className="
                  min-w-[220px]
                  snap-start
                "


              >




                <div
                  className="
                    relative
                    h-[130px]
                    rounded-3xl
                    bg-[#a63a50]
                    p-4
                    overflow-hidden
                    shadow-sm
                  "
                >





                  <div
                    className="
                      absolute
                      right-3
                      top-2
                      text-5xl
                      opacity-20
                    "
                  >

                    🏕️

                  </div>







                  <div
                    className="
                      relative
                      z-10
                    "
                  >




                    <h3
                      className="
                        text-[#FFFFFF]
                        font-bold
                        text-lg
                        uppercase
                        leading-tight
                        pr-6
                      "
                    >

                      {event.titolo}

                    </h3>







                    <p
                      className="
                        mt-7
                        text-[#FFFFFF]/100
                        text-xs
                        font-medium
                      "
                    >

                      📍 {event.luogo}

                    </p>







                    <p
                      className="
                        text-[#FFFFFF]/100
                        text-xs
                        mt-1
                        font-bold
                      "
                    >

                      📅 {event.data_inizio || event.data_evento}

                    </p>





                  </div>








                  <span
                    className="
                      absolute
                      bottom-3
                      right-4
                      text-[#FFF4E3]
                      text-xl
                    "
                  >

                    →

                  </span>







                </div>






              </Link>



            ))



          }





        </div>


      }



    </section>


  );


}