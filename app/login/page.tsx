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



      (event, session)=>{



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
 "https://supreme-parakeet-xrrj57j94p77cv775-3000.app.github.dev/auth/callback"


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



    <main className="
      min-h-screen
      p-6
      flex
      items-center
      justify-center
    ">



      <div className="
        text-center
        max-w-md
      ">






        <div className="
          text-7xl
          mb-6
        ">



          🏕️



        </div>







        <h1 className="
          text-5xl
          font-bold
          mb-4
        ">



          MONTI



        </h1>







        <p className="
          text-gray-600
          text-lg
          leading-relaxed
          mb-8
        ">



          Perché dopo anni di campeggi improvvisati era ora di fingere di essere organizzati.



          <br />

          <br />



          <span className="
            font-semibold
            italic
          ">



            "Il caos era la legge della natura; l'ordine era il sogno dell'uomo."



          </span>



          <br />



          Henry Adams



        </p>









        <Button

          onClick={loginWithGoogle}

        >



          🐰 Accedi con Google



        </Button>







        <p className="
          text-xs
          text-gray-400
          mt-6
        ">



          Solo per veri sopravvissuti 



        </p>







      </div>






    </main>


  );


}