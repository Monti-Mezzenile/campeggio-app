interface EventHeaderProps {

  titolo:string;

  luogo?:string;

  data?:string;

  isOwner?:boolean;

  onEdit?:()=>void;

  onDelete?:()=>void;

}


export default function EventHeader({

  titolo,

  luogo,

  data,

  isOwner,

  onEdit,

  onDelete,

}:EventHeaderProps){


  return (

    <div
      className="
        bg-black
        text-white
        rounded-3xl
        p-6
        mb-6
        relative
      "
    >



      {
        isOwner &&


        <div
          className="
            absolute
            top-4
            right-4
            flex
            gap-2
          "
        >



          <button

            onClick={onEdit}

            className="
              w-10
              h-10
              rounded-full
              bg-white/10
              flex
              items-center
              justify-center
              text-xl
            "

            title="Modifica evento"

          >

            ✏️

          </button>






          <button

            onClick={onDelete}

            className="
              w-10
              h-10
              rounded-full
              bg-red-600/80
              flex
              items-center
              justify-center
              text-xl
            "

            title="Elimina evento"

          >

            🗑️

          </button>




        </div>

      }






      <div
        className="
          text-5xl
          mb-4
        "
      >

        {
          titolo.toLowerCase().includes("winter")

          ?

          "⛺️❅"

          :

          "🏕️"

        }

      </div>






      <h1
        className="
          text-3xl
          font-bold
        "
      >

        {titolo}

      </h1>






      {

        luogo &&

        <p
          className="
            mt-3
            text-gray-300
          "
        >

          📍 {luogo}

        </p>

      }






      {

        data &&

        <p
          className="
            mt-1
            text-gray-300
          "
        >

          📅 {data}

        </p>

      }





    </div>

  );

}