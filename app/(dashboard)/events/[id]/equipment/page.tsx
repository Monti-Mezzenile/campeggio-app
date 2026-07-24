"use client";


import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

import BackButton from "@/components/ui/BackButton";



export default function EquipmentPage(){


  const params = useParams();

  const id = params.id as string;





  const [items,setItems] = useState<any[]>([]);

  const [openCategory,setOpenCategory] = useState<string | null>(null);

  const [loading,setLoading] = useState(true);









  const categories = [

    {
      name:"Attrezzatura Campeggio",
      icon:"⛺"
    },

    {
      name:"Cucina e Bagno",
      icon:"🍳"
    },

    {
      name:"Persona e Comfort",
      icon:"🧍"
    },

    {
      name:"Divertimento ed Extra",
      icon:"🎲"
    },

    {
      name:"Altro",
      icon:"📦"
    }

  ];









  async function loadData(){



    setLoading(true);







    const {data:eventItems,error}=await supabase

      .from("event_equipment")

      .select(`

        id,

        confermato,

        assegnato_a,

        equipment(

          id,

          nome,

          categoria,

          foto,

          quantita

        ),

        profiles:assegnato_a(

          nome,

          avatar_url

        )

      `)

      .eq("event_id",id);







    if(error){

      console.log(error);

    }







    setItems(eventItems || []);



    setLoading(false);


  }









  async function removeEquipment(eventEquipmentId:string){



    const confirmDelete = confirm(

      "Rimuovere questo oggetto dall'evento?"

    );




    if(!confirmDelete){

      return;

    }







    const {error}=await supabase

      .from("event_equipment")

      .delete()

      .eq("id",eventEquipmentId);







    if(error){

      console.log(error);

      alert(error.message);

      return;

    }







    loadData();


  }









  function getCategory(item:any){



    const category = item.equipment?.categoria;



    const validCategory = categories.find(

      cat=>cat.name===category

    );





    if(validCategory){

      return category;

    }





    return "Altro";


  }









  function getCategoryItems(category:string){



    return items.filter(

      item=>getCategory(item)===category

    );


  }









  useEffect(()=>{


    if(id){

      loadData();

    }


  },[id]);









  if(loading){

    return (

      <main className="p-6">

        Caricamento attrezzatura...

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



      <BackButton label="Evento" />




      <h1 className="
        text-3xl
        font-bold
        mb-6
      ">

        🎒 Attrezzatura MONTI

      </h1>








      <div className="
        flex
        flex-col
        gap-3
      ">



        {

          categories.map(category=>{


            const categoryItems = getCategoryItems(

              category.name

            );



            const open = openCategory===category.name;





            return (

              <div

                key={category.name}

                className="
                  bg-white
                  border
                  rounded-2xl
                  overflow-hidden
                "

              >





                <button

                  onClick={()=>


                    setOpenCategory(

                      open

                      ?

                      null

                      :

                      category.name

                    )


                  }

                  className="
                    w-full
                    p-5
                    flex
                    items-center
                    gap-4
                    text-left
                  "

                >





                  <span className="text-3xl">

                    {category.icon}

                  </span>








                  <div className="flex-1">


                    <h2 className="
                      font-bold
                      text-lg
                    ">

                      {category.name}

                    </h2>






                    <p className="
                      text-sm
                      text-gray-500
                    ">

                      {categoryItems.length} oggetti

                    </p>



                  </div>








                  <span className="text-xl">

                    {

                      open

                      ?

                      "⌃"

                      :

                      "›"

                    }

                  </span>





                </button>









                {

                  open &&



                  <div className="
                    border-t
                    p-4
                    flex
                    flex-col
                    gap-3
                  ">



                    {

                      categoryItems.length===0


                      ?


                      (

                        <p className="
                          text-gray-500
                          text-sm
                        ">

                          Nessun oggetto

                        </p>


                      )



                      :



                      categoryItems.map(item=>(



                        <div

                          key={item.id}

                          className="
                            border
                            rounded-xl
                            p-3
                            flex
                            items-center
                            gap-3
                          "

                        >






                          {

                            item.equipment?.foto &&


                            <img

                              src={item.equipment.foto}

                              alt={item.equipment.nome}

                              className="
                                w-14
                                h-14
                                rounded-xl
                                object-cover
                              "

                            />


                          }








                          <div className="
                            flex-1
                          ">




                            <h3 className="
                              font-semibold
                            ">

                              {item.equipment?.nome}

                            </h3>






                            <p className="
                              text-sm
                              text-gray-500
                            ">


                              👤


                              {" "}


                              {

                                item.profiles?.nome

                                ||

                                "Da assegnare"

                              }



                            </p>






                            {

                              item.equipment?.quantita &&


                              <p className="
                                text-xs
                                text-gray-500
                              ">


                                Quantità:

                                {" "}

                                {item.equipment.quantita}


                              </p>


                            }





                          </div>









                          <button

                            onClick={()=>removeEquipment(item.id)}

                            className="
                              text-red-500
                              text-sm
                            "

                          >

                            🗑️


                          </button>







                        </div>


                      ))

                    }



                  </div>


                }



              </div>


            );


          })


        }



      </div>






    </main>


  );


}