"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

import ExpenseSummary from "@/components/event/ExpenseSummary";



export default function ExpensesPage(){


  const params = useParams();

  const eventId = params.id as string;



  const [user,setUser]=useState<any>(null);

  const [participants,setParticipants]=useState<any[]>([]);

  const [expenses,setExpenses]=useState<any[]>([]);



  const [descrizione,setDescrizione]=useState("");

  const [importo,setImporto]=useState("");

  const [selectedUsers,setSelectedUsers]=useState<string[]>([]);



  const [loading,setLoading]=useState(true);








  async function loadData(){


    setLoading(true);





    const {

      data:{
        user

      }

    } = await supabase.auth.getUser();





    setUser(user);









    const {data:members,error:membersError}=await supabase

      .from("event_members")

      .select(`

        user_id,

        profiles:user_id(

          id,

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
        "partecipo"
      );






    if(membersError){

      console.log(
        "ERRORE PARTECIPANTI:",
        membersError
      );

    }







    const users = (members || [])

      .map((m:any)=>m.profiles);





    setParticipants(users);








    const {data:expenseData,error:expenseError}=await supabase

      .from("expenses")

      .select(`

        *

        ,

        profiles!expenses_payer_id_fkey(

          nome

        )

        ,

        expense_members:expense_members_expense_fk(

          quota,

          user_id,

          profiles:profiles!expense_members_user_fk(

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







    if(expenseError){

      console.log(
        "ERRORE SPESE:",
        expenseError
      );

    }







    setExpenses(expenseData || []);




    setLoading(false);


  }







  useEffect(()=>{


    if(eventId){

      loadData();

    }


  },[eventId]);




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

      !descrizione.trim()

      ||

      !importo

      ||

      selectedUsers.length===0

    ){

      alert(
        "Compila tutti i campi"
      );

      return;

    }





    if(!user){

      alert(
        "Utente non trovato"
      );

      return;

    }






    const amount=parseFloat(importo);






    const {data:expense,error}=await supabase

      .from("expenses")

      .insert({

        event_id:eventId,

        payer_id:user.id,

        descrizione:descrizione.trim(),

        importo:amount

      })

      .select()

      .single();







    console.log(
      "INSERT EXPENSE:",
      {
        expense,
        error
      }
    );







    if(error){

      alert(error.message);

      return;

    }








    const quota =

      amount / selectedUsers.length;








    const members = selectedUsers.map(id=>(

      {

        expense_id:expense.id,

        user_id:id,

        quota

      }

    ));








    const {error:memberError}=await supabase

      .from("expense_members")

      .insert(members);








    if(memberError){

      alert(memberError.message);

      return;

    }







    setDescrizione("");

    setImporto("");

    setSelectedUsers([]);





    await loadData();



  }













  async function deleteExpense(id:string){



    const ok=confirm(

      "Eliminare questa spesa?"

    );





    if(!ok){

      return;

    }






    const {error}=await supabase

      .from("expenses")

      .delete()

      .eq(
        "id",
        id
      );







    if(error){

      alert(error.message);

      return;

    }






    await loadData();



  }












  if(loading){


    return (

      <main className="p-6">

        Caricamento spese...

      </main>

    );


  }





  return (

    <main className="
      p-6
      max-w-3xl
      mx-auto
      pb-24
    ">





      <h1 className="
        text-2xl
        font-bold
        mb-6
      ">

        💸 Spese evento

      </h1>







      <ExpenseSummary

        participants={participants}

        expenses={expenses}

      />







      <section className="
        bg-white
        border
        rounded-3xl
        p-5
        mb-6
      ">





        <h2 className="
          font-bold
          text-xl
          mb-4
        ">

          Nuova spesa

        </h2>








        <input

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









        <input

          value={importo}

          onChange={e=>
            setImporto(e.target.value)
          }

          placeholder="Importo €"

          type="number"

          step="0.01"

          className="
            w-full
            border
            rounded-xl
            p-3
            mb-4
          "

        />









        <h3 className="font-semibold mb-3">

          Dividi con:

        </h3>









        <div className="
          flex
          flex-col
          gap-2
          mb-5
        ">







        {


          participants.map(p=>(



            <label

              key={p.id}

              className="
                flex
                gap-3
                items-center
              "

            >





              <input

                type="checkbox"

                checked={
                  selectedUsers.includes(p.id)
                }

                onChange={()=>
                  toggleUser(p.id)
                }

              />







              <span>

                {p.nome}

              </span>







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







      </section>












      <section className="
        flex
        flex-col
        gap-4
      ">





        {

          expenses.length===0

          ?

          (

            <div className="
              bg-white
              border
              rounded-2xl
              p-5
              text-center
              text-gray-500
            ">

              Nessuna spesa ancora 💸

            </div>

          )

          :

          expenses.map(exp=>(




            <div

              key={exp.id}

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
                items-start
              ">



                <h2 className="
                  font-bold
                ">

                  💸 {exp.descrizione}

                </h2>





                <button

                  onClick={()=>
                    deleteExpense(exp.id)
                  }

                  className="
                    text-red-500
                  "

                >

                  🗑️

                </button>





              </div>








              <p className="mt-2">

                {Number(exp.importo).toFixed(2)} €

              </p>








              <p className="
                text-sm
                text-gray-500
                mt-2
              ">

                Pagato da {exp.profiles?.nome}

              </p>









              <div className="
                mt-4
                text-sm
              ">



                <p className="
                  font-semibold
                  mb-2
                ">

                  Diviso tra:

                </p>







                {


                  exp.expense_members?.map((m:any)=>(



                    <div

                      key={m.user_id}

                      className="
                        flex
                        justify-between
                      "

                    >




                      <span>

                        👤 {m.profiles?.nome}

                      </span>





                      <span>

                        {Number(m.quota).toFixed(2)} €

                      </span>





                    </div>



                  ))



                }







              </div>








            </div>





          ))



        }







      </section>








    </main>


  );


}