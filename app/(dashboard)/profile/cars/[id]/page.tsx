"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import BackButton from "@/components/ui/BackButton";


export default function CarDetailPage(){


  const params = useParams();

  const router = useRouter();


  const id = params.id as string;



  const [car,setCar] = useState<any>(null);

  const [loading,setLoading] = useState(true);

  const [editing,setEditing] = useState(false);

  const [saving,setSaving] = useState(false);



  const [modello,setModello] = useState("");

  const [posti,setPosti] = useState("");

  const [partenza,setPartenza] = useState("");

  const [note,setNote] = useState("");

  const [foto,setFoto] = useState<File | null>(null);

  const [preview,setPreview] = useState("");








  async function loadCar(){


    setLoading(true);



    const {data,error}=await supabase

      .from("cars")

      .select("*")

      .eq("id",id)

      .single();




    if(error){

      console.log(error);

      setLoading(false);

      return;

    }




    setCar(data);

    setModello(data.modello || "");

    setPosti(data.posti_totali || "");

    setPartenza(data.partenza_predefinita || "");

    setNote(data.note || "");

    setPreview(data.foto || "");


    setLoading(false);

  }







  async function uploadPhoto(){


    if(!foto){

      return car?.foto || null;

    }



    const extension =
      foto.name.split(".").pop();



    const fileName =
      `${crypto.randomUUID()}.${extension}`;





    const {error}=await supabase.storage

      .from("cars")

      .upload(fileName,foto,{
        upsert:true
      });






    if(error){

      console.log(error);

      alert(error.message);

      return null;

    }






    const {data}=supabase.storage

      .from("cars")

      .getPublicUrl(fileName);






    return data.publicUrl;


  }







  async function saveCar(){


    setSaving(true);


    const fotoUrl = await uploadPhoto();



    const {error}=await supabase

      .from("cars")

      .update({

        modello,

        posti_totali:Number(posti),

        partenza_predefinita:
          partenza || null,

        note:
          note || null,

        foto:
          fotoUrl

      })

      .eq("id",id);




    if(error){

      console.log(error);

      alert(error.message);

      setSaving(false);

      return;

    }



    setSaving(false);

    setEditing(false);

    setFoto(null);

    loadCar();


  }







  async function deleteCar(){



    const ok = confirm(

      "Sei sicuro di voler eliminare questo mezzo?"

    );



    if(!ok){

      return;

    }




    const {error}=await supabase

      .from("cars")

      .delete()

      .eq("id",id);




    if(error){

      alert(error.message);

      return;

    }



    router.push("/profile/cars");


  }









  useEffect(()=>{


    if(id){

      loadCar();

    }


  },[id]);
    if(loading){


    return (

      <main className="p-6">

        Caricamento mezzo...

      </main>

    );

  }






  if(!car){


    return (

      <main className="p-6">

        Mezzo non trovato

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


      <BackButton label="I miei mezzi" />




      <h1 className="
        text-3xl
        font-bold
        mb-6
      ">

        🚗 {car.modello}

      </h1>







      <div className="
        bg-white
        border
        rounded-2xl
        p-5
      ">



        {
          preview &&


          <img

            src={preview}

            alt={car.modello}

            className="
              w-full
              h-52
              object-contain
              rounded-2xl
              mb-5
            "

          />

        }







        {
          editing &&


          <div className="mb-5">


            <label className="
              text-sm
              text-gray-500
            ">

              Foto mezzo

            </label>



            <input

              type="file"

              accept="image/*"

              onChange={(e)=>{


                const file =
                  e.target.files?.[0];


                if(file){

                  setFoto(file);

                  setPreview(
                    URL.createObjectURL(file)
                  );

                }


              }}

              className="
                w-full
                mt-2
              "

            />


          </div>


        }






        {
          editing

          ?

          <>

            <label className="font-semibold">

              Modello

            </label>


            <input

              value={modello}

              onChange={(e)=>setModello(e.target.value)}

              className="
                w-full
                border
                rounded-xl
                p-3
                mt-2
              "

            />



            <label className="
              font-semibold
              block
              mt-4
            ">

              Posti disponibili

            </label>


            <input

              type="number"

              value={posti}

              onChange={(e)=>setPosti(e.target.value)}

              className="
                w-full
                border
                rounded-xl
                p-3
                mt-2
              "

            />



            <label className="
              font-semibold
              block
              mt-4
            ">

              Partenza abituale

            </label>


            <input

              value={partenza}

              onChange={(e)=>setPartenza(e.target.value)}

              className="
                w-full
                border
                rounded-xl
                p-3
                mt-2
              "

            />



            <label className="
              font-semibold
              block
              mt-4
            ">

              Note

            </label>


            <textarea

              value={note}

              onChange={(e)=>setNote(e.target.value)}

              className="
                w-full
                border
                rounded-xl
                p-3
                mt-2
              "

            />



          </>


          :


          <>


            <p>

              👥 Posti disponibili:

              <b> {car.posti_totali}</b>

            </p>



            {
              car.partenza_predefinita &&

              <p className="mt-3">

                📍 {car.partenza_predefinita}

              </p>

            }



            {
              car.note &&

              <p className="
                mt-3
                text-gray-500
              ">

                📝 {car.note}

              </p>

            }



          </>


        }









        <button

          onClick={

            editing

            ?

            saveCar

            :

            ()=>setEditing(true)

          }

          className="
            mt-6
            w-full
            bg-black
            text-white
            rounded-xl
            p-3
          "

        >

          {

            saving

            ?

            "Salvataggio..."

            :

            editing

            ?

            "Salva modifiche"

            :

            "✏️ Modifica mezzo"

          }


        </button>





        <button

          onClick={deleteCar}

          className="
            mt-4
            w-full
            bg-red-600
            text-white
            rounded-xl
            p-3
          "

        >

          🗑️ Elimina mezzo

        </button>





      </div>





    </main>

  );

}