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


    <section className="mt-8">



      <div className="
        flex
        justify-between
        items-center
        mb-4
      ">



        <h2 className="
          text-xl
          font-semibold
        ">

          📚 I tuoi eventi

        </h2>





        {


          isAdmin && (


            <Link href="/events/new">


              <span className="
                text-sm
                underline
              ">

                + Crea

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



        <div className="
          flex
          gap-5
          overflow-x-auto
          pb-5
        ">



          {


            events.slice(0,3).map(event=>(



              <Link


                key={event.id}


                href={`/events/${event.id}`}


                className="
                  min-w-[260px]
                "


              >



                <Card>



                  <div className="
                    flex
                    justify-between
                    items-center
                  ">



                    <div>



                      <h3 className="
                        font-semibold
                      ">

                        🏕️ {event.titolo}

                      </h3>





                      <p className="
                        text-sm
                        text-gray-500
                      ">

                        📍 {event.luogo}

                      </p>





                      <p className="
                        text-sm
                        text-gray-400
                      ">

                        📅 {event.data_inizio || event.data_evento}

                      </p>




                    </div>





                    <span className="
                      text-gray-400
                      text-2xl
                    ">

                      ›

                    </span>




                  </div>



                </Card>



              </Link>



            ))



          }



        </div>


      }



    </section>


  );


}