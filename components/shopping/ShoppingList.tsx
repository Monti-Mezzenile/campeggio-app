"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase";


export default function ShoppingList({

  eventId,

  activeTab,

  items,

  user,

  reload


}:{

  eventId:string;

  activeTab:string;

  items:any[];

  user:any;

  reload:()=>void;


}){


  const [newItem,setNewItem]=useState("");

  const [adding,setAdding]=useState(false);





  const currentItems = items.filter(

    item=>item.categoria===activeTab

  );







  async function addItem(){


    if(!newItem.trim()){

      return;

    }



    setAdding(true);




    const {error}=await supabase

      .from("shopping_items")

      .insert({

        event_id:eventId,

        nome:newItem.trim(),

        categoria:activeTab,

        completato:false

      });




    if(error){

      alert(error.message);

      setAdding(false);

      return;

    }



    setNewItem("");

    setAdding(false);


    reload();


  }









  async function toggleItem(item:any){


    const {error}=await supabase

      .from("shopping_items")

      .update({

        completato:!item.completato,

        completato_da:

          !item.completato

          ?

          user?.id

          :

          null

      })

      .eq(

        "id",

        item.id

      );





    if(error){

      alert(error.message);

      return;

    }



    reload();


  }









  async function deleteItem(item:any){


    const confirmDelete = window.confirm(

      `Eliminare "${item.nome}"?`

    );


    if(!confirmDelete){

      return;

    }





    const {error}=await supabase

      .from("shopping_items")

      .delete()

      .eq(

        "id",

        item.id

      );





    if(error){

      alert(error.message);

      return;

    }




    reload();


  }









  return (

    <>





      <div className="
        flex
        gap-2
        mb-5
      ">


        <input


          value={newItem}


          onChange={e=>setNewItem(e.target.value)}


          placeholder="Aggiungi prodotto..."


          className="
            flex-1
            border
            rounded-xl
            p-3
          "


        />





        <button


          onClick={addItem}


          disabled={adding}


          className="
            bg-black
            text-white
            px-5
            rounded-xl
          "


        >

          {

            adding

            ?

            "..."

            :

            "+"

          }


        </button>



      </div>









      <div className="
        flex
        flex-col
        gap-3
      ">





        {


          currentItems.map(item=>(




            <div


              key={item.id}


              className="
                bg-white
                border
                rounded-xl
                p-4
                flex
                items-center
                justify-between
                gap-3
              "



            >





              <div className="
                flex
                items-center
                gap-3
                flex-1
              ">


                <input


                  type="checkbox"


                  checked={item.completato}


                  onChange={()=>toggleItem(item)}



                />






                <span



                  className={


                    item.completato


                    ?


                    "line-through text-gray-400"


                    :


                    ""


                  }


                >



                  {item.nome}



                </span>



              </div>







              <button


                onClick={()=>deleteItem(item)}


                className="
                  text-red-500
                  text-xl
                  px-2
                "


              >


                ❌


              </button>






            </div>




          ))



        }





      </div>






    </>


  );



}