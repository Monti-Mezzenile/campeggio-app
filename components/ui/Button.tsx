import React from "react";


interface ButtonProps {

  children: React.ReactNode;

  onClick?: () => void;

  disabled?: boolean;

  type?: "button" | "submit";

  variant?: "primary" | "secondary";

  className?: string;

}



export default function Button({

  children,

  onClick,

  disabled = false,

  type = "button",

  variant = "primary",

  className = "",

}: ButtonProps) {


  const baseStyle = `
    w-full
    rounded-2xl
    px-5
    py-3
    font-medium
    transition
    disabled:opacity-50
    disabled:cursor-not-allowed
  `;



  const variants = {

    primary: `
      bg-black
      text-white
      hover:bg-gray-800
    `,

    secondary: `
      bg-white
      text-black
      border
      border-gray-300
      hover:bg-gray-100
    `

  };



  return (

    <button

      type={type}

      onClick={onClick}

      disabled={disabled}

      className={`
        ${baseStyle}
        ${variants[variant]}
        ${className}
      `}

    >

      {children}

    </button>

  );

}