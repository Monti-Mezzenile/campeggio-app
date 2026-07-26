"use client";


import { useEffect } from "react";


import { supabase } from "@/lib/supabase";

import Button from "@/components/ui/Button";




export default function LoginPage(){



  useEffect(()=>{



    async function checkSession(){



      const {

        data:{
          session

        }

      } = await supabase.auth.getSession();





      console.log(

        "SESSIONE LOGIN:",

        session

      );



    }




    checkSession();






    const {

      data:{
        subscription

      }

    } = supabase.auth.onAuthStateChange(



      (event,session)=>{



        console.log(

          "AUTH EVENT:",

          event,

          session

        );



      }



    );







    return ()=>{



      subscription.unsubscribe();



    };




  },[]);









  async function loginWithGoogle(){



    console.log(

      "CLIC LOGIN GOOGLE"

    );





    const {

      data,

      error

    } = await supabase.auth.signInWithOAuth({



      provider:"google",



      options:{



        redirectTo:

        `${window.location.origin}/auth/callback`,



      }



    });








    console.log(

      "RISPOSTA GOOGLE:",

      data,

      error

    );








    if(error){



      console.log(error);



      alert(error.message);



    }



  }









  return (



    <main

      className="
        relative
        min-h-screen
        overflow-hidden
        flex
        items-center
        justify-center
        p-6
      "

    >





      {/* VIDEO BACKGROUND */}


      <video

        autoPlay

        muted

        loop

        playsInline

        className="
          absolute
          inset-0
          w-full
          h-full
          object-cover
        "

      >

        <source

          src="/videos/monti-login.mp4"

          type="video/mp4"

        />

      </video>








      {/* OVERLAY */}


      <div

        className="
          absolute
          inset-0
          bg-black/45
        "

      />









      {/* CONTENT */}


      <div

        className="
          relative
          z-10
          text-center
          max-w-md
          flex
          flex-col
          items-center
        "

      >








        {/* LOGO */}


        <img

          src="/images/logo-monti.png"

          alt="MONTI"

          className="
            w-70
            mb-0
            -translate-y-40
            drop-shadow-xl
          "

        />









        {/* DESCRIZIONE */}


        <p

          className="
            text-[#FFF4E3]
            text-lg
            leading-relaxed
            mb-0
            -translate-y-36
            drop-shadow-md
          "

        >

          Perché dopo anni di campeggi improvvisati era ora di fingere di essere organizzati.





          <br />

          <br />






          <span

            className="
              font-semibold
              italic
            "

          >

            "Il caos era la legge della natura; l'ordine era il sogno dell'uomo."

          </span>





          <br />





          <span

            className="
              text-sm
              opacity-80
            "

          >

            Henry Adams

          </span>





        </p>









        {/* LOGIN */}


        <Button

          onClick={loginWithGoogle}

          className="
            bg-transparent
            border
            border-[#FFF4E3]/70
            text-[#FFF4E3]
            backdrop-blur-sm
            shadow-lg
            hover:bg-[#FFF4E3]/10
          "

        >

          🐰 Accedi con Google


        </Button>









        {/* FOOTER */}


        <p

          className="
            text-xs
            text-[#FFF4E3]/100
            mt-3
            tracking-wide
          "

        >

          Solo per veri sopravvissuti


        </p>








      </div>








    </main>


  );


}