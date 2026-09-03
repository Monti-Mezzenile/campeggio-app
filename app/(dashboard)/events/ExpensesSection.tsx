"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RSVP_STATUS } from "@/lib/rsvp";


export default function ExpensesSection({

  eventId

}:{

  eventId:string;

}){


  const [expenses,setExpenses]=useState<any[]>([]);

  const [participants,setParticipants]=useState<any[]>([]);


  const [descrizione,setDescrizione]=useState("");

  const [importo,setImporto]=useState("");

  const [selectedUsers,setSelectedUsers]=useState<string[]>([]);





  async function loadData(){


    const {data:members}=await supabase

      .from("event_members")

      .select(`

        user_id,

        profiles:user_id(

          nome,
          avatar_url

        )

      `)

      .eq(

        "event_id",

        eventId

      )

      .eq(

        "stato",

        RSVP_STATUS.PARTECIPO

      );



    setParticipants(members || []);






    const {data:expenseData}=await supabase

      .from("expenses")

      .select(`

        *,

        profiles:payer_id(

          nome

        ),

        expense_members(

          user_id,

          quota,

          profiles:user_id(

            nome

          )

        )

      `)

      .eq(

        "event_id",

        eventId

      )

      .order(

        "created_at",

        {

          ascending:false

        }

      );



    setExpenses(expenseData || []);


  }






  useEffect(()=>{

    loadData();

  },[]);







  function toggleUser(id:string){


    if(selectedUsers.includes(id)){


      setSelectedUsers(

        selectedUsers.filter(

          u=>u!==id

        )

      );


    }

    else{


      setSelectedUsers([

        ...selectedUsers,

        id

      ]);


    }


  }







  async function addExpense(){



    if(

      !descrizione ||

      !importo ||

      selectedUsers.length===0

    ){

      alert(

        "Compila tutto"

      );

      return;

    }




    const totale=parseFloat(importo);



    const {error}=await supabase.rpc("create_expense_with_members", {

      p_event_id:eventId,

      p_description:descrizione,

      p_amount:totale,

      p_member_ids:selectedUsers

    });







    if(error){

      alert(error.message);

      return;

    }








    setDescrizione("");

    setImporto("");

    setSelectedUsers([]);

    loadData();


  }








  return (

    <div className="
      flex
      flex-col
      gap-5
    ">




      <div className="
        bg-white
        border
        rounded-2xl
        p-5
      ">


        <h2 className="
          text-xl
          font-bold
          mb-4
        ">

          💸 Nuova spesa

        </h2>





        <input

          value={descrizione}

          onChange={e=>setDescrizione(e.target.value)}

          placeholder="Descrizione"

          className="
            w-full
            border
            rounded-xl
            p-3
            mb-3
          "

        />





        <input

          value={importo}

          onChange={e=>setImporto(e.target.value)}

          placeholder="Importo €"

          type="number"

          className="
            w-full
            border
            rounded-xl
            p-3
            mb-4
          "

        />







        <p className="
          font-semibold
          mb-2
        ">

          Dividi con:

        </p>






        <div className="
          flex
          flex-col
          gap-2
          mb-4
        ">


        {

          participants.map(p=>(


            <label

              key={p.user_id}

              className="
                flex
                gap-2
                items-center
              "

            >


              <input

                type="checkbox"

                checked={selectedUsers.includes(p.user_id)}

                onChange={()=>toggleUser(p.user_id)}

              />


              {p.profiles?.nome}


            </label>


          ))

        }


        </div>







        <button

          onClick={addExpense}

          className="
            w-full
            bg-black
            text-white
            rounded-xl
            p-4
            font-semibold
          "

        >

          ➕ Aggiungi spesa

        </button>


      </div>









      <div className="
        flex
        flex-col
        gap-3
      ">


      {

        expenses.map(expense=>(


          <div

            key={expense.id}

            className="
              bg-white
              border
              rounded-2xl
              p-5
            "

          >


            <div className="
              flex
              justify-between
            ">


              <b>

                {expense.descrizione}

              </b>


              <b>

                € {expense.importo}

              </b>


            </div>



            <p className="
              text-sm
              text-gray-500
              mt-2
            ">

              Pagato da {expense.profiles?.nome}

            </p>






            <div className="
              mt-3
              text-sm
            ">


              {

                expense.expense_members?.map((m:any)=>(


                  <div key={m.user_id}>

                    {m.profiles?.nome}: € {m.quota.toFixed(2)}

                  </div>


                ))

              }


            </div>




          </div>


        ))

      }


      </div>





    </div>

  );


}
