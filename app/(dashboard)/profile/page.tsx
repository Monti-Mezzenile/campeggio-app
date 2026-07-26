 

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import LogoutButton from "@/components/ui/LogoutButton";
import { supabase } from "@/lib/supabase";



export default function ProfilePage(){


  const router = useRouter();



  const [profile,setProfile] = useState<any>(null);

  const [myBadges,setMyBadges] = useState<any[]>([]);

  const [loading,setLoading] = useState(true);

  const [saving,setSaving] = useState(false);

  const [editing,setEditing] = useState(false);



  const [nomeConiglio,setNomeConiglio] = useState("");

  const [padreFondatore,setPadreFondatore] = useState(false);







  async function loadProfile(){


    const {
      data:{
        user
      }
    } = await supabase.auth.getUser();



    if(!user){

      setLoading(false);

      return;

    }





    const {data}=await supabase

      .from("profiles")

      .select("*")

      .eq(
        "id",
        user.id
      )

      .single();





    setProfile(data);


    setNomeConiglio(
      data?.nome_coniglio || ""
    );


    setPadreFondatore(
      data?.padre_fondatore || false
    );





    const {data:badges}=await supabase

      .from("user_badges")

      .select(`

        badge:badge_id(

          id,

          immagine_url

        )

      `)

      .eq(
        "user_id",
        user.id
      );




    setMyBadges(
      badges || []
    );


    setLoading(false);


  }







  async function saveProfile(){


    setSaving(true);



    const {
      data:{
        user
      }
    } = await supabase.auth.getUser();




    if(!user){

      setSaving(false);

      return;

    }





    const {error}=await supabase

      .from("profiles")

      .update({

        nome_coniglio:nomeConiglio,

        padre_fondatore:padreFondatore

      })

      .eq(
        "id",
        user.id
      );





    if(error){

      alert(error.message);

      setSaving(false);

      return;

    }





    setSaving(false);

    setEditing(false);

    loadProfile();


  }







  useEffect(()=>{


    loadProfile();


  },[]);







  if(loading){

    return (

      <main className="
        min-h-screen
        p-6
      ">

        Caricamento profilo...

      </main>

    );

  }






  return (

    <main className="
      min-h-screen
      p-6
      pb-28
      max-w-3xl
      mx-auto
    ">



      <h1 className="
        text-xs
        font-bold
        uppercase
        tracking-widest
        text-[#FFF4E3]
        mb-4
      ">

        IL MIO PROFILO

      </h1>






      {/* PROFILO HERO */}



      <section className="
        rounded-[32px]
        bg-[#6C9A8B]
        p-6
        shadow-lg
        relative
        overflow-hidden
      ">


        <div className="
          absolute
          inset-0
          bg-white/5
        " />



        <div className="
          relative
          flex
          items-center
          gap-5
        ">



          {

            profile?.avatar_url &&


            <img

              src={profile.avatar_url}

              alt={profile.nome}

              className="
                w-24
                h-24
                rounded-3xl
                object-cover
                border
                border-[#FFF4E3]/40
              "

            />

          }






          <div className="flex-1">



            <h2 className="
              text-3xl
              font-bold
              text-[#FFF4E3]
              leading-tight
            ">

              {profile?.nome}

            </h2>




            <p className="
              text-sm
              text-[#FFF4E3]/60
            ">

              {profile?.email}

            </p>





            <div className="
              mt-3
              flex
              flex-wrap
              gap-2
            ">


              <span className="
                px-3
                py-1
                rounded-full
                bg-[#FFF4E3]/15
                text-[#FFF4E3]
                text-xs
                font-semibold
              ">

                🐰 {nomeConiglio || "Non scelto"}

              </span>




              <span className="
                px-3
                py-1
                rounded-full
                bg-[#FFF4E3]/15
                text-[#FFF4E3]
                text-xs
                font-semibold
              ">


                {
                  padreFondatore
                  ?
                  "🐴 Padre fondatore"
                  :
                  "🐇 Non marchiato"
                }


              </span>



            </div>





          </div>





          <button

            onClick={()=>setEditing(true)}

            className="
              text-2xl
              text-[#FFF4E3]
              active:scale-90
              transition
            "

          >

            ✏️

          </button>





        </div>



      </section>
      





      {/* MODIFICA PROFILO */}



      {


        editing &&



        <section className="
          mt-5
          rounded-[28px]
          bg-[#FFF4E3]/90
          backdrop-blur-md
          p-5
          shadow-md
        ">



          <div className="
            flex
            flex-col
            gap-5
          ">





            <div>

              <label className="
                text-xs
                uppercase
                tracking-widest
                font-bold
                text-[#1f2041]/60
              ">

                Nome da coniglio

              </label>




              <input

                value={nomeConiglio}

                onChange={(e)=>
                  setNomeConiglio(e.target.value)
                }

                placeholder="Inserisci nome da coniglio"

                className="
                  mt-2
                  w-full
                  rounded-2xl
                  p-3
                  bg-white
                  text-[#1f2041]
                  font-semibold
                "

              />


            </div>







            <div className="
              flex
              items-center
              justify-between
            ">




              <span className="
                text-sm
                font-bold
                text-[#1f2041]
              ">

                Padre fondatore?

              </span>






              <div className="
                flex
                gap-2
              ">




                <button

                  onClick={()=>
                    setPadreFondatore(true)
                  }

                  className={`
                    px-4
                    py-2
                    rounded-full
                    text-xs
                    font-bold
                    transition

                    ${
                      padreFondatore

                      ?

                      "bg-[#6C9A8B] text-[#FFF4E3]"

                      :

                      "bg-white text-[#1f2041]"

                    }

                  `}

                >

                  SI 🐴

                </button>







                <button

                  onClick={()=>
                    setPadreFondatore(false)
                  }

                  className={`
                    px-4
                    py-2
                    rounded-full
                    text-xs
                    font-bold
                    transition

                    ${
                      !padreFondatore

                      ?

                      "bg-[#a63a50] text-[#FFF4E3]"

                      :

                      "bg-white text-[#1f2041]"

                    }

                  `}

                >

                  NO 🐇

                </button>





              </div>





            </div>









            <button

              onClick={saveProfile}

              className="
                w-full
                rounded-2xl
                py-3
                bg-[#1f2041]
                text-[#FFF4E3]
                font-bold
                uppercase
                tracking-wide
              "

            >



              {

                saving

                ?

                "SALVATAGGIO..."

                :

                "SALVA PROFILO"

              }




            </button>






          </div>






        </section>


      }













      {/* MEDAGLIERE */}





      <section className="
        mt-6
        rounded-[28px]
        bg-[#F0D5B3]/75
        backdrop-blur-md
        p-5
        shadow-sm
      ">





        <div className="
          flex
          justify-between
          items-center
          mb-4
        ">




          <h2 className="
            text-xs
            uppercase
            tracking-[0.2em]
            font-bold
            text-[#1f2041]/60
          ">

            MEDAGLIE

          </h2>







          <button

            onClick={()=>
              router.push("/profile/badges")
            }

            className="
              text-xs
              font-bold
              uppercase
              text-[#a63a50]
            "

          >

            VEDI TUTTE →

          </button>





        </div>








        {


          myBadges.length > 0



          ?



          <div className="
            flex
            gap-4
            overflow-x-auto
            pb-1
          ">






            {


              myBadges.map((item:any)=>(



                <div

                  key={item.badge?.id}

                  className="
                    shrink-0
                  "

                >




                  {


                    item.badge?.immagine_url



                    ?



                    <img

                      src={item.badge.immagine_url}

                      className="
                        w-14
                        h-14
                        rounded-2xl
                        object-cover
                        border
                        border-[#1f2041]/10
                      "

                    />



                    :



                    <div className="
                      w-14
                      h-14
                      rounded-2xl
                      bg-[#FFF4E3]
                      flex
                      items-center
                      justify-center
                    ">

                      🏅

                    </div>



                  }





                </div>



              ))



            }




          </div>



          :



          <p className="
            text-sm
            font-semibold
            text-[#1f2041]
          ">

            Nessuna medaglia ancora 🏅

          </p>




        }





      </section>
      







      {/* INVENTARIO */}




      <section className="
        mt-8
      ">



        <h2 className="
          text-xs
          uppercase
          tracking-[0.2em]
          font-bold
          text-[#FFF4E3]
          mb-4
        ">

          IL MIO INVENTARIO

        </h2>







        <div className="
          grid
          grid-cols-2
          gap-5
        ">






          {[

            {
              icon:"⛺",
              text:"TENDE",
              link:"/profile/tents"
            },

            {
              icon:"🎒",
              text:"EQUIPMENT",
              link:"/profile/equipment"
            },

            {
              icon:"🏅",
              text:"BADGE",
              link:"/profile/badges"
            },

            {
              icon:"🚗",
              text:"MEZZI",
              link:"/profile/cars"
            }


          ].map(item=>(



            <button

              key={item.text}

              onClick={()=>router.push(item.link)}

              className="
                aspect-square
                rounded-[32px]
                bg-[#FFF4E3]/70
                backdrop-blur-lg
                border
                border-white/30
                shadow-md
                flex
                flex-col
                items-center
                justify-center
                transition
                active:scale-95
              "

            >



              <span className="
                text-6xl
              ">

                {item.icon}

              </span>






              <span className="
                mt-5
                text-sm
                font-bold
                uppercase
                tracking-wider
                text-[#1f2041]
              ">

                {item.text}

              </span>





            </button>



          ))}





        </div>






      </section>









      <div className="
        mt-12
      ">

        <LogoutButton />

      </div>







    </main>


  );


}