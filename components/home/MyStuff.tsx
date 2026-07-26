"use client";


import { useRouter } from "next/navigation";



export default function MyStuff(){


  const router = useRouter();



  const items = [


    {
      icona:"⛺",
      testo:"LE MIE TENDE",
      descrizione:"Gestisci tende e posti",
      link:"/profile/tents"
    },


    {
      icona:"🎒",
      testo:"ATTREZZATURA",
      descrizione:"Cose da portare",
      link:"/profile/equipment"
    },


    {
      icona:"🏅",
      testo:"MEDAGLIERE",
      descrizione:"I tuoi traguardi",
      link:"/profile/badges"
    },


    {
      icona:"🚗",
      testo:"I MIEI MEZZI",
      descrizione:"Auto e trasporti",
      link:"/profile/cars"
    }


  ];





  return (


    <section className="mt-6">



      <h2 className="
        text-xs
        font-bold
        uppercase
        tracking-widest
        text-[#FFF4E3]
        mb-3
      ">

        LA MIA ROBA

      </h2>







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


          items.map(item=>(


            <button


              key={item.testo}


              onClick={()=>router.push(item.link)}



              className="
                relative
                min-w-[180px]
                h-[110px]
                rounded-3xl
                bg-white
                border
                border-[#ebdec8]
                p-4
                text-left
                shadow-sm
                overflow-hidden
                snap-start
                transition
                hover:scale-[1.02]
              "


            >



              <div
                className="
                  absolute
                  right-3
                  top-3
                  text-4xl
                  opacity-20
                "
              >

                {item.icona}

              </div>





              <div
                className="
                  flex
                  items-center
                  gap-2
                  mb-3
                "
              >

                <span className="
                  text-2xl
                ">

                  {item.icona}

                </span>


              </div>






              <div
                className="
                  text-[#1f2041]
                  text-xs
                  font-bold
                  uppercase
                  tracking-wide
                "
              >

                {item.testo}

              </div>





              <div
                className="
                  text-[#6b6870]
                  text-[11px]
                  mt-1
                "
              >

                {item.descrizione}

              </div>





              <div
                className="
                  absolute
                  bottom-3
                  right-4
                  text-[#6c9a8b]
                  text-lg
                "
              >

                →

              </div>





            </button>


          ))


        }





      </div>




    </section>


  );


}