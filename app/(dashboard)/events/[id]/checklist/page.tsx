"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

import BackButton from "@/components/ui/BackButton";



export default function ChecklistPage(){


  const params = useParams();

  const eventId = params.id as string;



  const [checklistId,setChecklistId] = useState("");

  const [items,setItems] = useState<any[]>([]);

  const [equipment,setEquipment] = useState<any[]>([]);

  const [selectedEquipment,setSelectedEquipment] = useState<string[]>([]);

  const [showEquipment,setShowEquipment] = useState(false);

  const [loading,setLoading] = useState(true);

  const [nome,setNome] = useState("");








  async function loadChecklist(){


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








    /*
      PRENDO LA CHECKLIST ESISTENTE

      Una sola per:
      evento + utente

    */


    let {

      data:checklist,

      error:checkError

    } = await supabase

      .from("checklists")

      .select("*")

      .eq(
        "event_id",
        eventId
      )

      .eq(
        "user_id",
        user.id
      )

      .order(
        "created_at",
        {
          ascending:true
        }
      )

      .limit(1)

      .maybeSingle();







    console.log(
      "CHECKLIST TROVATA:",
      checklist,
      checkError
    );








    /*
      SE NON ESISTE LA CREO

    */


    if(!checklist){



      const {

        data:newChecklist,

        error:createError

      } = await supabase

        .from("checklists")

        .insert({

          event_id:eventId,

          user_id:user.id

        })

        .select()

        .single();







      if(createError){


        console.log(
          "ERRORE CREAZIONE CHECKLIST:",
          createError
        );


        setLoading(false);

        return;


      }







      checklist = newChecklist;


    }








    setChecklistId(

      checklist.id

    );








    /*
      CARICO GLI ELEMENTI

    */


    const {

      data:itemsData,

      error:itemsError

    } = await supabase

      .from("checklist_items")

      .select("*")

      .eq(

        "checklist_id",

        checklist.id

      )

      .order(

        "created_at",

        {
          ascending:true
        }

      );






    console.log(

      "ITEM CHECKLIST:",

      itemsData,

      itemsError

    );






    setItems(

      itemsData || []

    );









    /*
      CARICO ATTREZZATURA PERSONALE

    */


    const {

      data:equipmentData,

      error:equipmentError

    } = await supabase

      .from("equipment")

      .select("*")

      .eq(

        "user_id",

        user.id

      )

      .order(

        "created_at",

        {
          ascending:true
        }

      );







    console.log(

      "MIA ATTREZZATURA:",

      equipmentData,

      equipmentError

    );







    setEquipment(

      equipmentData || []

    );





    setLoading(false);


  }








  async function addItem(){


    if(!nome.trim()){

      return;

    }







    const {

      error

    } = await supabase

      .from("checklist_items")

      .insert({

        checklist_id:checklistId,

        nome:nome.trim(),

        completato:false

      });






    if(error){


      console.log(

        "ERRORE INSERIMENTO ITEM:",

        error

      );


      return;


    }






    setNome("");

    loadChecklist();


  }
    function toggleEquipment(id:string){


    if(selectedEquipment.includes(id)){


      setSelectedEquipment(

        selectedEquipment.filter(

          item=>item!==id

        )

      );


    }else{


      setSelectedEquipment([

        ...selectedEquipment,

        id

      ]);


    }


  }








  async function addEquipmentRows(rows:any[]){



    if(rows.length===0){

      return;

    }







    const {

      error

    } = await supabase

      .from("checklist_items")

      .insert(rows);








    if(error){


      console.log(

        "ERRORE INSERIMENTO ATTREZZATURA:",

        error

      );


      return;


    }







    setSelectedEquipment([]);

    setShowEquipment(false);


    loadChecklist();



  }









  async function addEquipmentToChecklist(){



    const existingIds = items

      .filter(

        item=>item.equipment_id

      )

      .map(

        item=>item.equipment_id

      );







    const selected = equipment.filter(

      item=>

        selectedEquipment.includes(item.id)

        &&

        !existingIds.includes(item.id)

    );








    const rows = selected.map(item=>(



      {

        checklist_id:checklistId,

        nome:item.nome,

        equipment_id:item.id,

        completato:false

      }



    ));







    await addEquipmentRows(rows);



  }









  async function addAllEquipmentToChecklist(){



    const existingIds = items

      .filter(

        item=>item.equipment_id

      )

      .map(

        item=>item.equipment_id

      );








    const rows = equipment

      .filter(

        item=>

          !existingIds.includes(item.id)

      )

      .map(item=>(



        {

          checklist_id:checklistId,

          nome:item.nome,

          equipment_id:item.id,

          completato:false

        }



      ));







    await addEquipmentRows(rows);



  }









  async function toggleItem(

    id:string,

    value:boolean

  ){



    const {

      data:{
        user
      }

    } = await supabase.auth.getUser();







    if(!user){

      return;

    }








    const item = items.find(

      item=>item.id===id

    );








    if(!item){

      return;

    }








    const {

      error:updateError

    } = await supabase

      .from("checklist_items")

      .update({

        completato:value

      })

      .eq(

        "id",

        id

      );







    if(updateError){


      console.log(

        "ERRORE CHECK ITEM:",

        updateError

      );


      return;


    }









    if(

      value

      &&

      item.equipment_id

    ){



      const {

        error:eventEquipmentError

      } = await supabase

        .from("event_equipment")

        .upsert({

          event_id:eventId,

          equipment_id:item.equipment_id,

          assegnato_a:user.id,

          confermato:true

        },

        {

          onConflict:

          "event_id,equipment_id,assegnato_a"

        });



      if(eventEquipmentError){


        console.log(

          "ERRORE EVENT EQUIPMENT:",

          eventEquipmentError

        );


      }


    }








    if(

      !value

      &&

      item.equipment_id

    ){



      await supabase

        .from("event_equipment")

        .delete()

        .eq(

          "event_id",

          eventId

        )

        .eq(

          "equipment_id",

          item.equipment_id

        )

        .eq(

          "assegnato_a",

          user.id

        );


    }






    loadChecklist();



  }









  async function deleteItem(id:string){



    const {

      error

    } = await supabase

      .from("checklist_items")

      .delete()

      .eq(

        "id",

        id

      );







    if(error){


      console.log(

        "ERRORE DELETE ITEM:",

        error

      );


      return;


    }






    loadChecklist();


  }









  useEffect(()=>{


    if(eventId){


      loadChecklist();


    }


  },[eventId]);








  if(loading){


    return (

      <main className="p-6">

        Caricamento checklist...

      </main>

    );


  }
    const completati = items.filter(

    item=>item.completato

  ).length;





  const percentuale = items.length

    ? Math.round(

        completati / items.length * 100

      )

    : 0;









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

        ✅ La mia checklist

      </h1>







      <div className="
        bg-white
        border
        rounded-2xl
        p-5
        mb-5
      ">


        Completata:

        <b> {percentuale}%</b>


      </div>









      <button

        onClick={()=>setShowEquipment(!showEquipment)}

        className="
          w-full
          bg-black
          text-white
          rounded-xl
          p-4
          mb-4
        "

      >

        🎒 Aggiungi dalla mia attrezzatura

      </button>









      {


        showEquipment &&


        (

          <div className="
            bg-white
            border
            rounded-2xl
            p-5
            mb-5
          ">


            <h2 className="
              font-bold
              mb-4
            ">

              La mia attrezzatura

            </h2>








            <button

              onClick={addAllEquipmentToChecklist}

              className="
                w-full
                bg-green-600
                text-white
                rounded-xl
                p-3
                mb-4
              "

            >

              ➕ Aggiungi tutto


            </button>









            {


              equipment.map(item=>(


                <label

                  key={item.id}

                  className="
                    flex
                    gap-3
                    mb-3
                  "

                >


                  <input

                    type="checkbox"

                    checked={

                      selectedEquipment.includes(item.id)

                    }

                    onChange={

                      ()=>toggleEquipment(item.id)

                    }

                  />



                  <span>

                    {item.nome}

                  </span>



                </label>


              ))


            }









            <button

              onClick={addEquipmentToChecklist}

              className="
                mt-4
                w-full
                bg-black
                text-white
                rounded-xl
                p-3
              "

            >

              Aggiungi selezionati

            </button>





          </div>


        )


      }









      <div className="
        flex
        gap-2
        mb-5
      ">


        <input

          value={nome}

          onChange={

            e=>setNome(e.target.value)

          }

          placeholder="Aggiungi elemento"

          className="
            flex-1
            border
            rounded-xl
            p-3
          "

        />






        <button

          onClick={addItem}

          className="
            bg-black
            text-white
            px-5
            rounded-xl
          "

        >

          +

        </button>



      </div>









      <div className="
        flex
        flex-col
        gap-3
      ">





        {


          items.map(item=>(


            <div

              key={item.id}

              className="
                bg-white
                border
                rounded-xl
                p-4
                flex
                justify-between
                items-center
              "

            >




              <label className="
                flex
                gap-3
                items-center
              ">




                <input

                  type="checkbox"

                  checked={

                    item.completato || false

                  }

                  onChange={

                    e=>

                    toggleItem(

                      item.id,

                      e.target.checked

                    )

                  }

                />






                <span

                  className={

                    item.completato

                    ?

                    "line-through opacity-50"

                    :

                    ""

                  }

                >

                  {item.nome}

                </span>





              </label>








              <button

                onClick={

                  ()=>deleteItem(item.id)

                }

                className="
                  text-xl
                "

              >

                🗑️

              </button>





            </div>


          ))


        }




      </div>







    </main>

  );


}