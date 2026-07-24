"use client";


interface HeaderProps {

  name?: string;

}



export default function Header({

  name

}: HeaderProps){


  return (

    <div className="
      text-center
      mb-6
    ">


      <h1 className="
        text-3xl
        font-bold
      ">

        🏕️ MONTI

      </h1>



      <p className="
        text-gray-500
        mt-2
      ">

        Ciao {name || "amico"} 👋

      </p>


    </div>

  );


}