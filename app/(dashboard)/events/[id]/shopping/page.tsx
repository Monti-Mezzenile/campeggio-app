"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

import BackButton from "@/components/ui/BackButton";

import ShoppingTabs from "@/components/shopping/ShoppingTabs";
import ShoppingList from "@/components/shopping/ShoppingList";
import MeatSection from "@/components/shopping/MeatSection";
import MenuSection from "@/components/shopping/MenuSection";


export default function ShoppingPage() {


  const params = useParams();

  const eventId = params.id as string;



  const [activeTab,setActiveTab] = useState("carne");

  const [items,setItems] = useState<any[]>([]);

  const [loading,setLoading] = useState(true);

  const [user,setUser] = useState<any>(null);

  const [callData,setCallData] = useState<any>(null);

  const [menu,setMenu] = useState<any>(null);

  const [canEditMenu,setCanEditMenu] = useState(false);





  async function loadData(){


    setLoading(true);



    const {

      data:{
        user

      }

    } = await supabase.auth.getUser();



    setUser(user);




    if(user){


      const {

        data:profile

      } = await supabase

        .from("profiles")

        .select("email,ruolo")

        .eq("id",user.id)

        .single();



      setCanEditMenu(

        profile?.ruolo==="admin" ||

        profile?.email==="alexscisci91@gmail.com"

      );


    }






    const {

      data:shopping,

      error:shoppingError

    } = await supabase

      .from("shopping_items")

      .select("*")

      .eq("event_id",eventId)

      .order("created_at");



    if(shoppingError){

      console.log(
        "ERRORE SHOPPING:",
        shoppingError
      );

    }



    setItems(shopping || []);







    const {

      data:call,

      error:callError

    } = await supabase

      .from("shopping_calls")

      .select(`

        *,

        profiles:user_id(

          nome

        )

      `)

      .eq("event_id",eventId)

      .eq("tipo","carne")

      .maybeSingle();



    if(callError){

      console.log(
        "ERRORE CARNE:",
        callError
      );

    }



    setCallData(call);








    const {

      data:eventMenu

    } = await supabase

      .from("event_menus")

      .select("*")

      .eq("event_id",eventId)

      .maybeSingle();



    setMenu(eventMenu);




    setLoading(false);


  }







  async function takeCarne(){


    if(!user){

      return;

    }




    const {

      error

    } = await supabase

      .from("shopping_calls")

      .insert({

        event_id:eventId,

        tipo:"carne",

        user_id:user.id,

        assegnato_a:user.id,

        prenotato:false

      });




    if(error){

      alert(error.message);

      return;

    }




    loadData();


  }








  async function answerCarne(value:boolean){


    if(!callData){

      return;

    }




    if(value){



      const {

        error

      } = await supabase

        .from("shopping_calls")

        .update({

          prenotato:true

        })

        .eq(

          "id",

          callData.id

        );



      if(error){

        alert(error.message);

        return;

      }



    }

    else{



      const {

        error

      } = await supabase

        .from("shopping_calls")

        .delete()

        .eq(

          "id",

          callData.id

        );



      if(error){

        alert(error.message);

        return;

      }



    }



    loadData();


  }








  async function cancelCarne(){


    if(!callData){

      return;

    }



    const {

      error

    } = await supabase

      .from("shopping_calls")

      .delete()

      .eq(

        "id",

        callData.id

      );



    if(error){

      alert(error.message);

      return;

    }




    loadData();


  }






  useEffect(()=>{


    if(eventId){

      loadData();

    }


  },[eventId]);





  if(loading){


    return (

      <main className="p-6">

        Caricamento spesa...

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


      <BackButton label="Evento"/>




      <h1 className="
        text-3xl
        font-bold
        mb-6
      ">

        🛒 Spesa

      </h1>





      <ShoppingTabs

        activeTab={activeTab}

        setActiveTab={setActiveTab}

        items={items}

      />







      {

        activeTab==="carne" && (


          <MeatSection

            eventId={eventId}

            user={user}

            callData={callData}

            takeCarne={takeCarne}

            answerCarne={answerCarne}

            cancelCarne={cancelCarne}

          />


        )

      }








      {

        activeTab!=="carne" &&

        activeTab!=="menu" && (


          <ShoppingList

            eventId={eventId}

            activeTab={activeTab}

            items={items}

            user={user}

            reload={loadData}

          />


        )

      }








      {

        activeTab==="menu" && (


          <MenuSection

            eventId={eventId}

            menu={menu}

            setMenu={setMenu}

            canEditMenu={canEditMenu}

          />


        )

      }





    </main>

  );


}