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









    let {data:checklist}=await supabase

      .from("checklists")

      .select("*")

      .eq("event_id",eventId)

      .eq("user_id",user.id)

      .maybeSingle();









    if(!checklist){



      const {data:newChecklist,error}=await supabase

        .from("checklists")

        .insert({

          event_id:eventId,

          user_id:user.id

        })

        .select()

        .single();







      if(error){

        console.log(error);

        setLoading(false);

        return;

      }



      checklist=newChecklist;

    }







    setChecklistId(checklist.id);








    const {data:itemsData}=await supabase

      .from("checklist_items")

      .select("*")

      .eq("checklist_id",checklist.id)

      .order("created_at");







    setItems(itemsData || []);







    const {data:equipmentData}=await supabase

      .from("equipment")

      .select("*")

      .eq("user_id",user.id)

      .order("created_at");







    setEquipment(equipmentData || []);



    setLoading(false);


  }









  async function addItem(){



    if(!nome.trim()) return;






    await supabase

      .from("checklist_items")

      .insert({

        checklist_id:checklistId,

        nome

      });






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





    const {error}=await supabase

      .from("checklist_items")

      .insert(rows);







    if(error){

      console.log(error);

      return;

    }






    setSelectedEquipment([]);

    setShowEquipment(false);

    loadChecklist();


  }









  async function addEquipmentToChecklist(){



    const existingIds = items

      .filter(item=>item.equipment_id)

      .map(item=>item.equipment_id);





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

        equipment_id:item.id

      }


    ));







    addEquipmentRows(rows);


  }









  async function addAllEquipmentToChecklist(){



    const existingIds = items

      .filter(item=>item.equipment_id)

      .map(item=>item.equipment_id);







    const rows = equipment

      .filter(item=>

        !existingIds.includes(item.id)

      )

      .map(item=>(


        {

          checklist_id:checklistId,

          nome:item.nome,

          equipment_id:item.id

        }


      ));







    addEquipmentRows(rows);


  }









  async function toggleItem(

  id:string,

  value:boolean

){


  const item = items.find(

    item=>item.id===id

  );


  if(!item){

    return;

  }




  const {

    data:{
      user

    }

  } = await supabase.auth.getUser();





  if(!user){

    return;

  }






  await supabase

    .from("checklist_items")

    .update({

      completato:value

    })

    .eq("id",id);









  if(value){


    if(item.equipment_id){


      await supabase

        .from("event_equipment")

        .insert({

          event_id:eventId,

          equipment_id:item.equipment_id,

          assegnato_a:user.id,

          confermato:true

        });


    }


  }



  else{


    if(item.equipment_id){


      await supabase

        .from("event_equipment")

        .delete()

        .eq("event_id",eventId)

        .eq("equipment_id",item.equipment_id)

        .eq("assegnato_a",user.id);


    }


  }






  loadChecklist();


}









  async function deleteItem(id:string){



    await supabase

      .from("checklist_items")

      .delete()

      .eq("id",id);






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

        completati/items.length*100

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


        <div className="
          bg-white
          border
          rounded-2xl
          p-5
          mb-5
        ">



          <h2 className="font-bold mb-4">

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

                  checked={selectedEquipment.includes(item.id)}

                  onChange={()=>toggleEquipment(item.id)}

                />


                {item.nome}


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

      }









      <div className="
        flex
        gap-2
        mb-5
      ">


        <input

          value={nome}

          onChange={(e)=>setNome(e.target.value)}

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
              "

            >



              <label className="
                flex
                gap-3
              ">


                <input

                  type="checkbox"

                  checked={item.completato}

                  onChange={(e)=>

                    toggleItem(

                      item.id,

                      e.target.checked

                    )

                  }

                />


                {item.nome}


              </label>





              <button

                onClick={()=>deleteItem(item.id)}

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