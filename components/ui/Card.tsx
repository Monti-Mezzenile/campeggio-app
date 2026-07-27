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
        bg-[#FFF4E3]/85
        backdrop-blur-md
        rounded-[1.5rem]
        border
        border-[#fcf9f4]/60
        shadow-md
        p-3
        ${className}
      `}

    >

      {children}

    </div>

  );

}