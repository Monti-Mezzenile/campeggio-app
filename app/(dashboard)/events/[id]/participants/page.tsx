"use client";


import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

import BackButton from "@/components/ui/BackButton";





export default function ParticipantsPage(){



  const params = useParams();


  const id = params.id as string;






  const [participants,setParticipants] = useState<any[]>([]);

  const [user,setUser] = useState<any>(null);

  const [loading,setLoading] = useState(true);

  const [updating,setUpdating] = useState(false);









  async function loadParticipants(){



    setLoading(true);







    const {

      data:{user}

    } = await supabase.auth.getUser();





    setUser(user);








    const {data:eventMembers,error}=await supabase


      .from("event_members")


      .select("*")


      .eq("event_id",id);








    if(error){



      console.log(error);



      setLoading(false);



      return;



    }









    const result = await Promise.all(



      (eventMembers || []).map(async(member:any)=>{





        const {data:profile}=await supabase


          .from("profiles")


          .select("*")


          .eq("id",member.user_id)


          .single();







        return {


          ...member,


          profile


        };



      })



    );









    const ordered = result.sort((a,b)=>{



      const order:any={

        partecipo:0,

        forse:1,

        non_posso:2

      };



      return (

        order[a.stato] ?? 3

      )

      -

      (

        order[b.stato] ?? 3

      );



    });







    setParticipants(ordered);

    setLoading(false);



  }









  async function changeStatus(

    memberId:string,

    stato:string

  ){



    setUpdating(true);








    const {error}=await supabase


      .from("event_members")


      .update({

        stato

      })

      .eq("id",memberId);








    if(error){



      console.log(error);


      alert(error.message);


      setUpdating(false);


      return;



    }








    setParticipants(prev=>

      prev.map(person=>

        person.id===memberId

        ?

        {

          ...person,

          stato

        }

        :

        person

      )

    );








    setUpdating(false);



  }









  useEffect(()=>{



    if(id){


      loadParticipants();


    }



  },[id]);











  if(loading){


    return (


      <main style={{padding:40}}>


        Caricamento partecipanti...


      </main>


    );


  }









  return (



    <main

      

      style={{



        padding:20,



        maxWidth:700,



        margin:"auto"



      }}



    >

      <BackButton label="Evento" />




      <h1



        style={{



          color:"#222",



          marginBottom:20



        }}



      >



        👥 Partecipanti



      </h1>









      {

        participants.length === 0 &&



        <div



          style={{



            padding:20,



            background:"#fff",



            color:"#222",



            border:"1px solid #ddd",



            borderRadius:16,



            textAlign:"center"



          }}



        >



          Nessun partecipante



        </div>



      }









      <div



        style={{



          display:"flex",



          flexDirection:"column",



          gap:10



        }}



      >






        {

          participants.map((person:any)=>(



            <ParticipantCard



              key={person.id}



              person={person}



              user={user}



              changeStatus={changeStatus}



              updating={updating}



            />



          ))



        }





      </div>








    </main>



  );



}













function ParticipantCard({



  person,



  user,



  changeStatus,



  updating



}:any){





  const [open,setOpen] = useState(false);






  const profile = person.profile;






  const isMe = user?.id === person.user_id;









  let statoIcon = "🟡";


  let statoLabel = "Forse";







  if(person.stato === "partecipo"){



    statoIcon = "🟢";


    statoLabel = "Partecipo";



  }








  if(person.stato === "non_posso"){



    statoIcon = "🔴";


    statoLabel = "Non posso";



  }








  return (



    <div



      onClick={()=>setOpen(!open)}



      style={{



        background:"#fff",



        color:"#222",



        border:"1px solid #ddd",



        borderRadius:16,



        padding:"10px 14px",



        cursor:"pointer"



      }}



    >







      <div



        style={{



          display:"flex",



          alignItems:"center",



          justifyContent:"space-between"



        }}



      >







        <div



          style={{



            display:"flex",



            alignItems:"center",



            gap:10



          }}



        >





          {

            profile?.avatar_url &&



            <img



              src={profile.avatar_url}



              width="38"



              height="38"



              style={{



                borderRadius:"50%",



                objectFit:"cover"



              }}



            />

          }






          <div>



            <div



              style={{



                fontSize:15,



                fontWeight:"600"



              }}



            >


              {profile?.nome || "Utente"}



              {

                isMe &&

                <span style={{marginLeft:8}}>

                  ⭐ Tu

                </span>

              }


            </div>







            <div



              style={{



                fontSize:13,



                color:"#555"



              }}



            >



              {statoIcon} {statoLabel}



            </div>






          </div>






        </div>







        <div



          style={{



            fontSize:18,



            color:"#555"



          }}



        >



          {open ? "▲" : "▼"}



        </div>






      </div>



      {

        open &&



        <div



          style={{



            marginTop:12,



            paddingTop:12,



            borderTop:"1px solid #eee",



            fontSize:14



          }}



        >







          {

            isMe &&



            <div



              style={{



                marginBottom:15,



                padding:12,



                background:"#f7f7f7",



                borderRadius:12



              }}



            >



              <b>



                Cambia stato



              </b>







              <div



                style={{



                  display:"flex",



                  gap:8,



                  marginTop:10,



                  flexWrap:"wrap"



                }}



              >





                <button



                  disabled={updating}



                  onClick={(e)=>{



                    e.stopPropagation();



                    changeStatus(

                      person.id,

                      "partecipo"

                    );



                  }}



                  style={{



                    padding:"8px 12px",



                    borderRadius:10,



                    border:"1px solid #ddd",



                    background:"#fff"



                  }}



                >



                  🟢 Partecipo



                </button>








                <button



                  disabled={updating}



                  onClick={(e)=>{



                    e.stopPropagation();



                    changeStatus(

                      person.id,

                      "forse"

                    );



                  }}



                  style={{



                    padding:"8px 12px",



                    borderRadius:10,



                    border:"1px solid #ddd",



                    background:"#fff"



                  }}



                >



                  🟡 Forse



                </button>








                <button



                  disabled={updating}



                  onClick={(e)=>{



                    e.stopPropagation();



                    changeStatus(

                      person.id,

                      "non_posso"

                    );



                  }}



                  style={{



                    padding:"8px 12px",



                    borderRadius:10,



                    border:"1px solid #ddd",



                    background:"#fff"



                  }}



                >



                  🔴 Non posso



                </button>







              </div>



            </div>



          }









          <div



            style={{



              marginBottom:12



            }}



          >



            🏕️ <b>Arrivo</b>



            <br />



            {



              person.arrivo_data

              ?

              person.arrivo_data

              :

              "Non indicato"



            }



            {



              person.arrivo_ora &&



              <span>



                {" "} - {String(person.arrivo_ora).slice(0,5)}



              </span>



            }



          </div>









          <div



            style={{



              marginBottom:12



            }}



          >



            🚗 <b>Partenza</b>



            <br />



            {



              person.partenza_data

              ?

              person.partenza_data

              :

              "Non indicata"



            }



            {



              person.partenza_ora &&



              <span>



                {" "} - {String(person.partenza_ora).slice(0,5)}



              </span>



            }



          </div>









          {



            profile?.telefono &&



            <div>



              📞 {profile.telefono}



            </div>



          }








        </div>



      }



    </div>



  );



}