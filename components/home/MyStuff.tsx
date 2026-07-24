"use client";


import { useRouter } from "next/navigation";



export default function MyStuff(){


  const router = useRouter();



  const items = [


    {
      icona:"⛺",
      testo:"Le mie tende",
      link:"/profile/tents"
    },


    {
      icona:"🎒",
      testo:"Attrezzatura",
      link:"/profile/equipment"
    },


    {
      icona:"🏅",
      testo:"Medagliere",
      link:"/profile/badges"
    },


    {
      icona:"🚗",
      testo:"I miei mezzi",
      link:"/profile/cars"
    }


  ];





  return (


    <section className="mt-8">



      <h2 className="
        text-xl
        font-semibold
        mb-4
      ">

        👤 La mia roba

      </h2>





      <div className="
        grid
        grid-cols-2
        gap-3
      ">




        {


          items.map(item=>(


            <button


              key={item.testo}


              onClick={()=>router.push(item.link)}


              className="
                bg-white
                border
                rounded-2xl
                p-3
                text-left
              "


            >




              <div className="
                flex
                items-center
                gap-2
              ">



                <span className="text-xl">

                  {item.icona}

                </span>




                <span className="
                  font-semibold
                  text-sm
                ">

                  {item.testo}

                </span>



              </div>



            </button>


          ))



        }



      </div>




    </section>


  );


}