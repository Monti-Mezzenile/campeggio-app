"use client";


import Link from "next/link";



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



      <div

        className="
          bg-[#6c9a8b]
          rounded-[2rem]
          p-5
          shadow-md
          border
          border-[#ebdec8]/30
          active:scale-[0.98]
          transition
        "

      >



        <div className="
          text-center
        ">



          <p className="
            text-xs
            uppercase
            tracking-[0.25em]
            text-[#ebdec8]
            font-semibold
            opacity-90
          ">

            🔥 MONTI SI AVVICINA

          </p>







          {

            daysLeft !== null && (


              <div className="
                mt-4
              ">


                <p className="
                  text-5xl
                  font-bold
                  text-[#ebdec8]
                  leading-none
                ">

                  {daysLeft}

                </p>




                <p className="
                  mt-1
                  text-sm
                  text-[#ebdec8]
                  opacity-90
                ">

                  giorni al prossimo campeggio

                </p>


              </div>


            )

          }







          <div className="
            mt-5
          ">


            <h2 className="
              text-xl
              font-bold
              text-[#ebdec8]
            ">

              🏕️ {event.titolo}

            </h2>






            <div className="
              mt-3
              text-sm
              text-[#ebdec8]
              opacity-90
              space-y-1
            ">


              <p>

                📍 {event.luogo}

              </p>




              <p>

                📅 {event.data_inizio || event.data_evento}

              </p>


            </div>


          </div>








          {

            event.participation && (


              <div className="
                mt-4
              ">


                <span

                  className="
                    inline-block
                    px-4
                    py-1.5
                    rounded-full
                    bg-[#ebdec8]/20
                    text-[#ebdec8]
                    text-sm
                    font-semibold
                    backdrop-blur-sm
                  "

                >


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


                </span>


              </div>


            )


          }





        </div>



      </div>



    </Link>


  );


}