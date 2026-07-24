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

      <main className="p-6">

        Caricamento profilo...

      </main>

    );

  }
    return (

    <main className="
      p-6
      pb-28
      max-w-3xl
      mx-auto
    ">






      <h1 className="
        text-3xl
        font-bold
        mb-6
      ">

        👤 Profilo

      </h1>








      <div className="
        relative
        mb-8
        px-2
      ">








        <div className="
          flex
          items-start
          justify-between
        ">





          <div className="
            flex
            items-center
            gap-4
          ">





            {


              profile?.avatar_url &&



              <img

                src={profile.avatar_url}

                alt={profile.nome}

                className="
                  w-20
                  h-20
                  rounded-full
                  object-cover
                "

              />



            }








            <div>


              <h2 className="
                text-2xl
                font-bold
              ">

                {profile?.nome}

              </h2>





              <p className="text-gray-500">

                {profile?.email}

              </p>




            </div>





          </div>







          {


            !editing &&



            <button

              onClick={()=>setEditing(true)}

              className="
                text-2xl
                p-1
                active:scale-90
                transition
              "

            >

              ✏️


            </button>



          }




        </div>









        {/* MEDAGLIE PROFILO */}



        {


          myBadges.length > 0 &&



          <div className="
            mt-5
            flex
            gap-2
            overflow-x-auto
            pb-2
          ">



            {


              myBadges.map((item:any)=>(



                <div

                  key={item.badge?.id}

                  className="
                    flex-shrink-0
                  "

                >



                  {


                    item.badge?.immagine_url



                    ?



                    <img

                      src={item.badge.immagine_url}

                      className="
                        w-10
                        h-10
                        rounded-full
                        object-cover
                      "

                    />



                    :



                    <div className="
                      w-10
                      h-10
                      rounded-full
                      bg-gray-100
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



        }









      <div className="mt-6">




        {


          editing

          ?

          <>


            <label className="font-semibold">

              Nome da Coniglio:

            </label>





            <input

              value={nomeConiglio}

              onChange={(e)=>
                setNomeConiglio(e.target.value)
              }

              placeholder="Inserisci nome da Coniglio"

              className="
                mt-2
                w-full
                border
                rounded-xl
                p-3
              "

            />



          </>



          :



          <div>


            <p className="font-semibold">

              Nome da Coniglio:

              <span className="
                ml-2
                font-normal
              ">

                🐰 {nomeConiglio || "Non scelto"}

              </span>



            </p>





            {


              padreFondatore



              ?



              <p className="
                mt-2
                text-gray-600
              ">

                sono un padre fondatore 🐴

              </p>





              :



              <p className="
                mt-2
                text-gray-600
              ">

                non sono un padre fondatore 🐇

              </p>



            }





          </div>




        }



      </div>
            {


        editing &&



        <div className="
          mt-5
          flex
          items-center
          justify-between
        ">




          <span className="font-semibold">

            Sei un padre fondatore?

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
                rounded-xl
                border
                ${
                  padreFondatore
                  ?
                  "bg-black text-white"
                  :
                  "bg-white"
                }
              `}

            >

              Sì

            </button>









            <button

              onClick={()=>
                setPadreFondatore(false)
              }

              className={`
                px-4
                py-2
                rounded-xl
                border
                ${
                  !padreFondatore
                  ?
                  "bg-black text-white"
                  :
                  "bg-white"
                }
              `}

            >

              No

            </button>








          </div>






        </div>



      }








      {


        editing &&



        <button

          onClick={saveProfile}

          className="
            mt-6
            w-full
            bg-black
            text-white
            rounded-xl
            p-3
          "

        >



          {


            saving

            ?

            "Salvataggio..."

            :

            "Salva modifiche"



          }



        </button>



      }









      </div>









      {/* TAB PROFILO */}





      <div className="
        grid
        grid-cols-2
        gap-4
      ">






        <button

          onClick={()=>
            router.push("/profile/tents")
          }

          className="
            aspect-square
            rounded-3xl
            bg-orange-50
            flex
            flex-col
            items-center
            justify-center
            active:scale-95
            transition
          "

        >

          <span className="text-5xl">

            ⛺

          </span>



          <span className="
            mt-3
            font-semibold
          ">

            Le mie tende

          </span>



        </button>









        <button

          onClick={()=>
            router.push("/profile/equipment")
          }

          className="
            aspect-square
            rounded-3xl
            bg-green-50
            flex
            flex-col
            items-center
            justify-center
            active:scale-95
            transition
          "

        >

          <span className="text-5xl">

            🎒

          </span>



          <span className="
            mt-3
            font-semibold
          ">

            Attrezzatura

          </span>



        </button>
                <button

          onClick={()=>
            router.push("/profile/badges")
          }

          className="
            aspect-square
            rounded-3xl
            bg-yellow-50
            flex
            flex-col
            items-center
            justify-center
            active:scale-95
            transition
          "

        >

          <span className="text-5xl">

            🏅

          </span>



          <span className="
            mt-3
            font-semibold
          ">

            Medagliere

          </span>



        </button>








        <button

          onClick={()=>
            router.push("/profile/cars")
          }

          className="
            aspect-square
            rounded-3xl
            bg-blue-50
            flex
            flex-col
            items-center
            justify-center
            active:scale-95
            transition
          "

        >

          <span className="text-5xl">

            🚗

          </span>



          <span className="
            mt-3
            font-semibold
          ">

            I miei mezzi

          </span>



        </button>







      </div>








      <div className="mt-8">

        <LogoutButton />

      </div>






    </main>


  );


}