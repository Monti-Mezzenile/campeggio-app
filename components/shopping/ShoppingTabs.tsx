"use client";


export default function ShoppingTabs({

  activeTab,

  setActiveTab,

  items


}:{

  activeTab:string;

  setActiveTab:(tab:string)=>void;

  items:any[];

}){



const tabs=[


  {
    id:"carne",
    nome:"🥩 Carne"
  },


  {
    id:"freschi",
    nome:"🥬 Freschi"
  },


  {
    id:"generi_vari",
    nome:"📦 Generi vari"
  },


  {
    id:"menu",
    nome:"🍽️ Menu"
  }


];




return (


<div className="
  grid
  grid-cols-2
  gap-3
  mb-6
">


{


tabs.map(tab=>(


<button


key={tab.id}


onClick={()=>setActiveTab(tab.id)}


className={`

border

rounded-xl

p-4

font-semibold


${

activeTab===tab.id

?

"bg-black text-white"

:

"bg-white"

}


`}


>


{tab.nome}



{


tab.id!=="menu"

&&


<span className="
block
text-xs
">


{


items.filter(

i=>i.categoria===tab.id

).length


}

{" "}oggetti


</span>


}



</button>



))


}



</div>


);


}