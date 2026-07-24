import React from "react";



interface CardProps {

  children: React.ReactNode;

  className?: string;

}



export default function Card({
  children,
  className = "",
}: CardProps) {


  return (

    <div

      className={`
        bg-white
        rounded-2xl
        border
        border-gray-200
        shadow-sm
        p-5
        ${className}
      `}

    >

      {children}

    </div>

  );

}