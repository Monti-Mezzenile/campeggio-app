import { NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";



export async function GET(request: Request) {


  const url = new URL(request.url);


  const code = url.searchParams.get("code");



  const redirectUrl = new URL(
    "/",
    "https://supreme-parakeet-xrrj57j94p77cv775-3000.app.github.dev"
  );



  const response = NextResponse.redirect(
    redirectUrl
  );



  if(code){


    const supabase = createServerClient(


      process.env.NEXT_PUBLIC_SUPABASE_URL!,


      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,


      {


        cookies:{


          getAll(){


            return request.headers

              .get("cookie")

              ?.split(";")

              .map(cookie=>{


                const [name,...rest] = cookie.trim().split("=");


                return {


                  name,


                  value:rest.join("=")


                };


              })

              ||

              [];


          },



          setAll(cookies){


            cookies.forEach(({name,value,options})=>{


              response.cookies.set(

                name,

                value,

                options

              );


            });


          }


        }


      }


    );



    const {

      error

    } = await supabase.auth.exchangeCodeForSession(code);



    if(error){


      console.log(
        "ERRORE CALLBACK:",
        error
      );


      return NextResponse.redirect(

        new URL(

          "/login",

          "https://supreme-parakeet-xrrj57j94p77cv775-3000.app.github.dev"

        )

      );


    }



  }



  return response;


}