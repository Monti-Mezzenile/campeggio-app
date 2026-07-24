interface EmptyStateProps {

  icon: string;

  title: string;

  description?: string;

  action?: React.ReactNode;

}



export default function EmptyState({

  icon,

  title,

  description,

  action,

}: EmptyStateProps) {


  return (

    <div

      className="
        flex
        flex-col
        items-center
        justify-center
        text-center
        py-12
        px-6
        bg-white
        rounded-2xl
        border
        border-gray-200
      "

    >


      <div

        className="
          text-5xl
          mb-4
        "

      >

        {icon}

      </div>



      <h3

        className="
          text-xl
          font-semibold
        "

      >

        {title}

      </h3>



      {
        description &&

        <p

          className="
            text-gray-500
            mt-2
            max-w-sm
          "

        >

          {description}

        </p>

      }



      {
        action &&

        <div

          className="
            mt-6
            w-full
          "

        >

          {action}

        </div>

      }



    </div>

  );

}