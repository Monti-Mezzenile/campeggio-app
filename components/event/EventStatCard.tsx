interface EventStatCardProps {

  icona: string;

  titolo: string;

  valore: string | number;

  descrizione?: string;

}



export default function EventStatCard({

  icona,

  titolo,

  valore,

  descrizione,

}: EventStatCardProps) {


  return (

    <div

      className="
        bg-white
        rounded-2xl
        border
        border-gray-200
        p-5
        min-h-[150px]
        flex
        flex-col
        justify-between
      "

    >


      <div className="text-4xl">

        {icona}

      </div>



      <div>


      <div
  className="
    text-4xl
    font-bold
    text-gray-900
    mt-3
  "
>
  {valore}
</div>



        <div

          className="
            font-medium
            text-gray-800
            mt-1
          "

        >

          {titolo}

        </div>



        {
          descrizione &&

          <div

            className="
              text-sm
              text-gray-500
              mt-2
            "

          >

            {descrizione}

          </div>

        }


      </div>


    </div>

  );

}