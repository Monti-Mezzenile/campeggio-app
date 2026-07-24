"use client";


import Link from "next/link";

import { usePathname } from "next/navigation";



export default function BottomNav(){


  const pathname = usePathname();




  const items = [


    {
      name:"Home",
      icon:"🏕️",
      href:"/"
    },


    {
      name:"Storico",
      icon:"📚",
      href:"/history"
    },


    {
      name:"Curiosità",
      icon:"💡",
      href:"/curiosita"
    },


    {
      name:"Profilo",
      icon:"👤",
      href:"/profile"
    }


  ];








  return (


    <nav

      className="
        fixed
        bottom-4
        left-4
        right-4
        h-20
        rounded-3xl
        shadow-lg
        flex
        items-center
        justify-around
        z-50
        border
        border-black/5
      "

      style={{

        background:"#F0D5B3"

      }}

    >





      {


        items.map((item)=>(


          <Link


            key={item.href}


            href={item.href}


            className={`
              
              flex
              flex-col
              items-center
              justify-center
              gap-1
              rounded-2xl
              px-4
              py-2
              transition-all
              duration-200

              ${
                pathname === item.href

                ?

                "text-white scale-105"

                :

                "text-[#3D3E62]"

              }

            `}


            style={

              pathname === item.href

              ?

              {
                background:"#6C9A8B"
              }

              :

              {}

            }


          >





            <span className="
              text-2xl
            ">

              {item.icon}

            </span>






            <span className="
              text-xs
              font-medium
            ">

              {item.name}

            </span>





          </Link>


        ))



      }





    </nav>


  );


}