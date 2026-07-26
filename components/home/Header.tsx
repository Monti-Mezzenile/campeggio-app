"use client";


interface HeaderProps {

  name?: string;

}



export default function Header({

  name

}: HeaderProps){


  return (

    <header className="
      flex
      flex-col
      items-center
      mb-8
    ">


      {/* Logo MONTI */}

      <img

        src="/monti/logo.png"

        alt="MONTI"

        className="
          w-50
          h-auto
          object-contain
        "

      />





      {/* Saluto */}

      <p

        className="
          -mt-2
          text-[#ebdec8]
          text-1xl
        "

        style={{

          fontFamily:"var(--font-caveat)"

        }}

      >

        Ciao coniglietto\a 🐰

      </p>



    </header>

  );


}