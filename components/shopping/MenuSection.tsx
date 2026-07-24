"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase";


export default function MenuSection({

  eventId,

  menu,

  setMenu,

  canEditMenu


}:{

  eventId:string;

  menu:any;

  setMenu:(value:any)=>void;

  canEditMenu:boolean;

}){



  const [editingMenu,setEditingMenu]=useState(false);

  const [savingMenu,setSavingMenu]=useState(false);

  const [menuSaved,setMenuSaved]=useState(false);






  async function saveMenu(){


    setSavingMenu(true);




    const {error}=await supabase

      .from("event_menus")

      .update({

        venerdi_cena:menu?.venerdi_cena || "",

        sabato_pranzo:menu?.sabato_pranzo || "",

        sabato_cena:menu?.sabato_cena || "",

        domenica_pranzo:menu?.domenica_pranzo || "",

        updated_at:new Date()

      })

      .eq(

        "event_id",

        eventId

      );





    if(error){

      alert(error.message);

      setSavingMenu(false);

      return;

    }





    setSavingMenu(false);

    setEditingMenu(false);

    setMenuSaved(true);





    setTimeout(()=>{

      setMenuSaved(false);

    },3000);



  }







  const pasti=[

    {

      key:"venerdi_cena",

      titolo:"🍕 Venerdì cena"

    },

    {

      key:"sabato_pranzo",

      titolo:"🥪 Sabato pranzo"

    },

    {

      key:"sabato_cena",

      titolo:"🍖 Sabato cena"

    },

    {

      key:"domenica_pranzo",

      titolo:"☕ Domenica pranzo"

    }


  ];








  return (

    <div className="
      bg-white
      border
      rounded-xl
      p-5
    ">


      <h2 className="
        font-bold
        text-xl
        mb-5
      ">

        🍽️ Menu MONTI

      </h2>







      {


        pasti.map(pasto=>(


          <div

            key={pasto.key}

            className="
              mb-5
            "

          >


            <h3 className="
              font-semibold
              mb-2
            ">

              {pasto.titolo}

            </h3>







            {


              canEditMenu && editingMenu


              ?


              <textarea

                value={menu?.[pasto.key] || ""}


                onChange={e=>

                  setMenu({

                    ...menu,

                    [pasto.key]:e.target.value

                  })

                }



                className="
                  w-full
                  border
                  rounded-xl
                  p-3
                  min-h-24
                "


                placeholder="Inserisci il menu..."

              />



              :



              <div className="
                border
                rounded-xl
                p-3
                bg-gray-50
                min-h-16
                whitespace-pre-line
              ">


                {

                  menu?.[pasto.key]

                  ||

                  "Menu da definire"

                }


              </div>



            }





          </div>



        ))


      }









      {


        canEditMenu &&


        <div className="
          flex
          flex-col
          gap-3
        ">



          {


            !editingMenu


            ?


            <button

              onClick={()=>setEditingMenu(true)}

              className="
                w-full
                bg-black
                text-white
                rounded-xl
                p-4
                font-semibold
              "

            >

              ✏️ Modifica menu

            </button>



            :



            <button

              onClick={saveMenu}

              disabled={savingMenu}

              className="
                w-full
                bg-black
                text-white
                rounded-xl
                p-4
                font-semibold
              "

            >


              {

                savingMenu

                ?

                "Salvataggio..."

                :

                "💾 Salva menu"

              }


            </button>



          }





          {


            menuSaved &&


            <div className="
              text-center
              text-green-600
              font-semibold
            ">

              ✅ Menu salvato

            </div>


          }



        </div>


      }



    </div>


  );


}