"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";


export default function MeatSection({

  eventId,

  user,

  callData,

  takeCarne,

  answerCarne,

  cancelCarne


}:{

  eventId:string;

  user:any;

  callData:any;

  takeCarne:()=>void;

  answerCarne:(value:boolean)=>void;

  cancelCarne:()=>void;


}){


  const [meatItems,setMeatItems]=useState<any[]>([]);

  const [newMeat,setNewMeat]=useState("");

  const [loading,setLoading]=useState(true);





  async function loadMeat(){


    setLoading(true);



    const {data,error}=await supabase

      .from("meat_items")

      .select(`

        *,

        meat_votes(

          user_id,

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

          ascending:true

        }

      );



    if(error){

      console.log(

        "ERRORE CARICAMENTO CARNE:",

        error

      );

    }



    setMeatItems(data || []);

    setLoading(false);


  }







  async function addMeat(){


    if(!newMeat.trim()){

      return;

    }



    const {error}=await supabase

      .from("meat_items")

      .insert({

        event_id:eventId,

        nome:newMeat.trim()

      });



    if(error){

      alert(error.message);

      return;

    }



    setNewMeat("");

    loadMeat();


  }








  async function deleteMeat(meat:any){


    const confirmDelete = window.confirm(

      `Eliminare "${meat.nome}"?`

    );



    if(!confirmDelete){

      return;

    }





    const {error:votesError}=await supabase

      .from("meat_votes")

      .delete()

      .eq(

        "meat_item_id",

        meat.id

      );



    if(votesError){

      alert(votesError.message);

      return;

    }





    const {error}=await supabase

      .from("meat_items")

      .delete()

      .eq(

        "id",

        meat.id

      );



    if(error){

      alert(error.message);

      return;

    }



    loadMeat();


  }








  async function toggleVote(meat:any){


    if(!user){

      return;

    }





    const alreadyVoted =

      meat.meat_votes?.some(

        (vote:any)=>

          vote.user_id===user.id

      );







    if(alreadyVoted){



      const {error}=await supabase

        .from("meat_votes")

        .delete()

        .eq(

          "meat_item_id",

          meat.id

        )

        .eq(

          "user_id",

          user.id

        );



      if(error){

        alert(error.message);

        return;

      }



    }

    else{



      const {error}=await supabase

        .from("meat_votes")

        .insert({

          meat_item_id:meat.id,

          user_id:user.id

        });



      if(error){

        alert(error.message);

        return;

      }



    }



    loadMeat();


  }








  useEffect(()=>{


    if(eventId){

      loadMeat();

    }


  },[eventId]);
    return (

    <div className="
      flex
      flex-col
      gap-5
    ">



      {/* CHI PRENOTA CARNE */}

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

          🥩 Chi prenota la carne?

        </h2>





        {


          !callData ?


          <button

            onClick={takeCarne}

            className="
              w-full
              bg-black
              text-white
              rounded-xl
              p-4
            "

          >

            🥩 Chiamo io!

          </button>



          :



          !callData.prenotato ?



          <div>


            <p className="
              font-semibold
              mb-4
            ">

              👤 {callData.profiles?.nome} hai prenotato?

            </p>



            <div className="
              flex
              gap-3
            ">


              <button

                onClick={()=>answerCarne(true)}

                className="
                  flex-1
                  bg-green-600
                  text-white
                  rounded-xl
                  p-3
                "

              >

                SI

              </button>




              <button

                onClick={()=>answerCarne(false)}

                className="
                  flex-1
                  border
                  rounded-xl
                  p-3
                "

              >

                NO

              </button>


            </div>


          </div>



          :



          <div className="
            flex
            justify-between
            items-center
          ">


            <p className="font-semibold">

              🐴 {callData.profiles?.nome} ha prenotato 

            </p>



            <button

              onClick={cancelCarne}

              className="
                text-red-500
                text-xl
              "

            >

              ❌

            </button>


          </div>



        }


      </div>








      {/* VOTAZIONE CARNE */}


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

          🗳️ Cosa prendiamo?

        </h2>





        <div className="
          flex
          gap-2
          mb-5
        ">


          <input

            value={newMeat}

            onChange={e=>setNewMeat(e.target.value)}

            placeholder="Aggiungi tipo carne"

            className="
              flex-1
              border
              rounded-xl
              p-3
            "

          />



          <button

            onClick={addMeat}

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








        {


          loading


          ?


          <p>

            Caricamento...

          </p>



          :



          <div className="
            flex
            flex-col
            gap-3
          ">



            {


              meatItems.map(meat=>(


                <div

                  key={meat.id}

                  className="
                    border
                    rounded-xl
                    p-4
                  "

                >



                  <button

                    onClick={()=>toggleVote(meat)}

                    className="
                      w-full
                      text-left
                    "

                  >


                    <div className="
                      flex
                      justify-between
                      items-center
                    ">


                      <span className="font-semibold">

                        🥩 {meat.nome}

                      </span>



                      <span>

                        👥 {meat.meat_votes?.length || 0}

                      </span>


                    </div>






                    {


                      meat.meat_votes?.length > 0 &&


                      <div className="
                        mt-3
                        text-sm
                        text-gray-600
                      ">


                        {


                          meat.meat_votes.map((vote:any)=>(


                            <div

                              key={vote.user_id}

                            >

                              ✓ {vote.profiles?.nome || "Utente"}

                            </div>


                          ))


                        }


                      </div>


                    }



                  </button>






                  <button

                    onClick={()=>deleteMeat(meat)}

                    className="
                      mt-3
                      text-red-500
                      text-sm
                      font-semibold
                    "

                  >

                    ❌ Elimina carne

                  </button>




                </div>


              ))


            }



          </div>



        }



      </div>



    </div>

  );


}