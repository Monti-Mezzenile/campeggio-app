interface EventProgressProps {

  partecipanti:number;

  tende:number;

}



export default function EventProgress({

  partecipanti,

  tende,

}:EventProgressProps){


  const tasks = [

    {
      nome:"Partecipanti",
      fatto: partecipanti > 0,
      icona:"👥"
    },

    {
      nome:"Tende",
      fatto: tende > 0,
      icona:"⛺"
    },

    {
      nome:"Auto",
      fatto:false,
      icona:"🚗"
    },

    {
      nome:"Attrezzatura",
      fatto:false,
      icona:"🎒"
    },

    {
      nome:"Spesa",
      fatto:false,
      icona:"🛒"
    }

  ];



  const completati = tasks.filter(
    t => t.fatto
  ).length;



  const percentuale = Math.round(
    (completati / tasks.length) * 100
  );



  return (

    <div className="
      bg-white
      rounded-2xl
      border
      p-5
      mb-6
    ">


      <h2 className="
        font-semibold
        text-lg
      ">

        Preparazione campeggio

      </h2>



      <div className="
        mt-4
        h-3
        bg-gray-200
        rounded-full
        overflow-hidden
      ">

        <div

          className="
            h-full
            bg-black
          "

          style={{
            width:`${percentuale}%`
          }}

        />

      </div>



      <p className="
        mt-2
        text-sm
        text-gray-500
      ">

        {percentuale}% completato

      </p>





      <div className="
        mt-5
        space-y-2
      ">


        {
          tasks.map(task=>(

            <div

              key={task.nome}

              className="
                flex
                justify-between
                items-center
              "

            >

              <span>

                {task.icona} {task.nome}

              </span>


              <span>

                {
                  task.fatto
                  ? "✅"
                  : "⚠️"
                }

              </span>


            </div>

          ))

        }


      </div>


    </div>

  );

}