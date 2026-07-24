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
        bottom-0
        left-0
        right-0
        bg-white
        border-t
        border-gray-200
        h-20
        flex
        items-center
        justify-around
        z-50
      "


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

              text-xs

              transition

              ${

                pathname === item.href

                ?

                "text-black font-semibold"

                :

                "text-gray-400"

              }


            `}


          >



            <span className="text-2xl">


              {item.icon}


            </span>




            <span>


              {item.name}


            </span>




          </Link>



        ))



      }



    </nav>


  );


}