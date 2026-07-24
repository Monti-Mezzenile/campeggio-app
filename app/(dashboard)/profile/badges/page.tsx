"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";



export default function BadgesPage(){


  const [badges,setBadges]=useState<any[]>([]);

  const [myBadges,setMyBadges]=useState<any[]>([]);

  const [loading,setLoading]=useState(true);

  const [isAdmin,setIsAdmin]=useState(false);

  const [user,setUser]=useState<any>(null);



  const [selectedBadge,setSelectedBadge]=useState<any>(null);

  const [adding,setAdding]=useState(false);



  const [titolo,setTitolo]=useState("");

  const [descrizione,setDescrizione]=useState("");

  const [tipo,setTipo]=useState("speciale");



  const [file,setFile]=useState<File|null>(null);

  const [preview,setPreview]=useState("");

  const [uploading,setUploading]=useState(false);







  async function loadData(){


    setLoading(true);



    const {
      data:{
        user
      }
    } = await supabase.auth.getUser();





    if(!user){

      setLoading(false);

      return;

    }



    setUser(user);







    const {data:profile}=await supabase

      .from("profiles")

      .select("ruolo")

      .eq(
        "id",
        user.id
      )

      .single();





    setIsAdmin(

      profile?.ruolo==="admin"

    );







    const {data:badgeData}=await supabase

      .from("badges")

      .select("*")

      .order(
        "created_at",
        {
          ascending:false
        }
      );





    setBadges(

      badgeData || []

    );








    const {data:userBadgeData}=await supabase

      .from("user_badges")

      .select(`

        id,

        badge:badge_id(

          id,

          titolo,

          descrizione,

          immagine_url

        )

      `)

      .eq(

        "user_id",

        user.id

      );





    setMyBadges(

      userBadgeData || []

    );





    setLoading(false);


  }
  useEffect(()=>{


    loadData();


  },[]);








  function handleFile(e:any){


    const selected=e.target.files?.[0];


    if(!selected){

      return;

    }



    setFile(selected);


    setPreview(

      URL.createObjectURL(selected)

    );


  }









  async function addMyBadge(id:string){


    if(!user){

      return;

    }






    const {error}=await supabase

      .from("user_badges")

      .insert({

        user_id:user.id,

        badge_id:id

      });






    if(error){

      alert(error.message);

      return;

    }





    setSelectedBadge(null);


    loadData();



  }









  async function removeMyBadge(id:string){



    const ok=confirm(

      "Rimuovere questa medaglia dalla tua collezione?"

    );



    if(!ok){

      return;

    }








    const {error}=await supabase

      .from("user_badges")

      .delete()

      .eq(

        "id",

        id

      );






    if(error){

      alert(error.message);

      return;

    }







    loadData();



  }












  async function deleteBadge(id:string,immagine_url:string){



    if(!isAdmin){

      return;

    }






    const ok=confirm(

      "Eliminare definitivamente questa medaglia dal catalogo?"

    );





    if(!ok){

      return;

    }








    const {error:userError}=await supabase

      .from("user_badges")

      .delete()

      .eq(

        "badge_id",

        id

      );






    if(userError){

      alert(userError.message);

      return;

    }







    const {error:badgeError}=await supabase

      .from("badges")

      .delete()

      .eq(

        "id",

        id

      );







    if(badgeError){

      alert(badgeError.message);

      return;

    }









    if(immagine_url){



      const fileName = immagine_url

        .split("/badges/")[1];




      if(fileName){



        await supabase.storage

          .from("badges")

          .remove([

            fileName

          ]);



      }



    }







    loadData();



  }










  async function createBadge(){



    if(!titolo.trim()){


      alert(

        "Inserisci un titolo"

      );


      return;


    }






    setUploading(true);






    let immagine_url="";







    if(file){



      const fileName=

        `${Date.now()}-${file.name}`;







      const {error:uploadError}=await supabase.storage

        .from("badges")

        .upload(

          fileName,

          file

        );







      if(uploadError){


        alert(uploadError.message);

        setUploading(false);

        return;


      }








      const {data:urlData}=supabase.storage

        .from("badges")

        .getPublicUrl(

          fileName

        );






      immagine_url=urlData.publicUrl;



    }







    const {error}=await supabase

      .from("badges")

      .insert({

        titolo,

        descrizione,

        tipo,

        immagine_url

      });







    if(error){


      alert(error.message);

      setUploading(false);

      return;


    }






    setTitolo("");

    setDescrizione("");

    setTipo("speciale");

    setFile(null);

    setPreview("");

    setAdding(false);

    setUploading(false);



    loadData();



  }
    if(loading){

    return (

      <main className="p-6">

        Caricamento medagliere...

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









      <div className="
        flex
        justify-between
        items-center
        mb-6
      ">


        <h1 className="
          text-3xl
          font-bold
        ">

          🏅 Medagliere

        </h1>





        {


          isAdmin &&



          <button

            onClick={()=>setAdding(!adding)}

            className="
              w-12
              h-12
              rounded-full
              bg-black
              text-white
              text-2xl
            "

          >

            +

          </button>


        }



      </div>









      {


        adding &&



        <section className="
          bg-white
          rounded-3xl
          p-5
          mb-8
        ">



          <h2 className="
            font-bold
            text-xl
            mb-4
          ">

            Nuova medaglia

          </h2>







          <input

            type="file"

            accept="image/*"

            onChange={handleFile}

            className="
              mb-4
            "

          />







          {


            preview &&



            <img

              src={preview}

              className="
                w-32
                h-32
                rounded-2xl
                object-cover
                mb-4
              "

            />


          }







          <input

            value={titolo}

            onChange={e=>
              setTitolo(e.target.value)
            }

            placeholder="Titolo medaglia"

            className="
              w-full
              border
              rounded-xl
              p-3
              mb-3
            "

          />







          <textarea

            value={descrizione}

            onChange={e=>
              setDescrizione(e.target.value)
            }

            placeholder="Descrizione"

            className="
              w-full
              border
              rounded-xl
              p-3
              mb-3
            "

          />







          <select

            value={tipo}

            onChange={e=>
              setTipo(e.target.value)
            }

            className="
              w-full
              border
              rounded-xl
              p-3
            "

          >


            <option value="speciale">

              ⭐ Speciale

            </option>




            <option value="evento">

              🏕️ Evento

            </option>



          </select>







          <button

            onClick={createBadge}

            className="
              mt-4
              w-full
              bg-black
              text-white
              rounded-xl
              p-3
            "

          >

            {

              uploading

              ?

              "Caricamento..."

              :

              "Crea medaglia"

            }


          </button>





        </section>



      }









      {/* CATALOGO */}



      <section className="mb-8">



        <h2 className="
          text-xl
          font-bold
          mb-4
        ">

          Tutte le medaglie

        </h2>






        <div className="
          flex
          gap-3
          overflow-x-auto
          pb-3
        ">




          {


            badges.map((badge:any)=>(


              <div

                key={badge.id}

                className="
                  relative
                  flex-shrink-0
                  w-20
                "

              >





                <button

                  onClick={()=>
                    setSelectedBadge(badge)
                  }

                  className="
                    w-full
                  "

                >




                  {


                    badge.immagine_url



                    ?



                    <img

                      src={badge.immagine_url}

                      className="
                        w-14
                        h-14
                        rounded-xl
                        object-cover
                        mx-auto
                      "

                    />



                    :



                    <div className="
                      w-14
                      h-14
                      rounded-xl
                      bg-gray-100
                      flex
                      items-center
                      justify-center
                      text-2xl
                      mx-auto
                    ">

                      🏅

                    </div>



                  }







                  <p className="
                    text-xs
                    mt-2
                    text-center
                    line-clamp-2
                  ">

                    {badge.titolo}

                  </p>





                </button>








                {


                  isAdmin &&



                  <button

                    onClick={()=>
                      deleteBadge(
                        badge.id,
                        badge.immagine_url
                      )
                    }

                    className="
                      absolute
                      -top-2
                      -right-1
                      bg-white
                      rounded-full
                      shadow
                      w-6
                      h-6
                      text-xs
                    "

                  >

                    🗑️

                  </button>



                }





              </div>



            ))



          }






        </div>





      </section>
            {


        selectedBadge &&



        <div className="
          fixed
          inset-0
          bg-black/40
          flex
          items-center
          justify-center
          z-50
          p-6
        ">



          <div className="
            bg-white
            rounded-3xl
            p-6
            w-full
            max-w-sm
            text-center
          ">





            {


              selectedBadge.immagine_url



              ?



              <img

                src={selectedBadge.immagine_url}

                className="
                  w-32
                  h-32
                  mx-auto
                  rounded-3xl
                  object-cover
                  mb-4
                "

              />



              :



              <div className="
                w-32
                h-32
                mx-auto
                rounded-3xl
                bg-gray-100
                flex
                items-center
                justify-center
                text-6xl
                mb-4
              ">

                🏅

              </div>



            }








            <h2 className="
              text-xl
              font-bold
            ">

              {selectedBadge.titolo}

            </h2>








            {


              selectedBadge.descrizione &&



              <p className="
                text-gray-500
                mt-2
              ">

                {selectedBadge.descrizione}

              </p>



            }








            <button

              onClick={()=>
                addMyBadge(selectedBadge.id)
              }

              className="
                mt-6
                w-full
                bg-black
                text-white
                rounded-xl
                p-3
              "

            >

              Aggiungi alle mie 🏅

            </button>








            <button

              onClick={()=>
                setSelectedBadge(null)
              }

              className="
                mt-3
                w-full
                border
                rounded-xl
                p-3
              "

            >

              Chiudi

            </button>




          </div>




        </div>



      }









      {/* LE MIE MEDAGLIE */}





      <section>



        <h2 className="
          text-xl
          font-bold
          mb-4
        ">

          Le mie medaglie

        </h2>







        {


          myBadges.length===0



          ?



          <p className="text-gray-500">

            Nessuna medaglia ancora 🥲

          </p>





          :





          <div className="
            grid
            grid-cols-3
            gap-5
          ">






            {


              myBadges.map((item:any)=>(



                <div

                  key={item.id}

                  className="
                    relative
                    text-center
                  "

                >







                  <button

                    onClick={()=>
                      removeMyBadge(item.id)
                    }

                    className="
                      absolute
                      -top-2
                      -right-2
                      w-7
                      h-7
                      bg-white
                      rounded-full
                      shadow
                      text-xs
                      z-10
                    "

                  >

                    ✕

                  </button>









                  {


                    item.badge?.immagine_url



                    ?



                    <img

                      src={item.badge.immagine_url}

                      className="
                        w-24
                        h-24
                        rounded-3xl
                        object-cover
                        mx-auto
                      "

                    />



                    :



                    <div className="
                      w-24
                      h-24
                      rounded-3xl
                      bg-gray-100
                      flex
                      items-center
                      justify-center
                      text-5xl
                      mx-auto
                    ">

                      🏅

                    </div>




                  }






                </div>



              ))



            }





          </div>




        }





      </section>
          </main>

  );


}