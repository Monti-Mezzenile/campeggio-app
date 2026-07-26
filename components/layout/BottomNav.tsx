"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";


export default function BottomNav(){


  const pathname = usePathname();



  const items = [


    {
      name:"HOME",
      icon:"🏕️",
      href:"/"
    },


    {
      name:"MONTI",
      icon:"📚",
      href:"/history"
    },


    {
      name:"IDEE",
      icon:"💡",
      href:"/curiosita"
    },


    {
      name:"IO",
      icon:"👤",
      href:"/profile"
    }


  ];






  return (


    <nav

      className="
        fixed
        bottom-5
        left-5
        right-5
        h-[76px]
        rounded-[28px]
        flex
        items-center
        justify-around
        z-50
        shadow-xl
        border
        border-[#FFF4E3]/30
        backdrop-blur-md
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

              relative

              flex
              flex-col
              items-center
              justify-center

              w-[70px]
              h-[58px]

              rounded-2xl

              transition-all
              duration-300


              ${
                pathname === item.href

                ?

                "text-[#FFF4E3]"

                :

                "text-[#3D3E62]"

              }

            `}



          >





            {


              pathname === item.href &&


              (

                <span

                  className="
                    absolute
                    inset-0
                    rounded-2xl
                    -z-10
                    shadow-md
                  "

                  style={{

                    background:"#6C9A8B"

                  }}

                />


              )


            }







            <span

              className={`
                text-2xl
                transition-transform
                duration-300

                ${
                  pathname === item.href

                  ?

                  "scale-110 -translate-y-1"

                  :

                  ""

                }

              `}

            >

              {item.icon}

            </span>







            <span

              className={`

                text-[11px]

                tracking-[0.15em]

                uppercase

                font-extrabold

                leading-none


                ${
                  pathname === item.href

                  ?

                  "mt-1"

                  :

                  "mt-1"

                }

              `}

            >

              {item.name}

            </span>





          </Link>


        ))

      }





    </nav>


  );


}