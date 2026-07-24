"use client";


export default function ExpenseSummary({

  participants,

  expenses


}:{

  participants:any[];

  expenses:any[];

}){



  function calculateUser(id:string){


    let paid = 0;

    let owes = 0;



    expenses.forEach(exp=>{


      if(exp.payer_id === id){

        paid += Number(exp.importo);

      }





      exp.expense_members?.forEach((member:any)=>{


        if(member.user_id === id){

          owes += Number(member.quota);

        }


      });



    });





    return {

      paid,

      owes,

      balance: paid - owes

    };


  }






  const total = expenses.reduce(

    (sum,exp)=>

      sum + Number(exp.importo),

    0

  );





  const average =

    participants.length > 0

    ?

    total / participants.length

    :

    0;







  return (

    <section className="
      bg-white
      border
      rounded-3xl
      p-5
      mb-6
    ">



      <h2 className="
        text-xl
        font-bold
        mb-5
      ">

        💰 Situazione spese

      </h2>





      <div className="
        bg-gray-50
        rounded-xl
        p-4
        mb-5
      ">


        <p>

          💸 Totale evento:

          {" "}

          <b>

            {total.toFixed(2)} €

          </b>

        </p>



        <p>

          👥 Media a testa:

          {" "}

          <b>

            {average.toFixed(2)} €

          </b>

        </p>



      </div>









      <div className="
        flex
        flex-col
        gap-3
      ">


        {


          participants.map(user=>{


            const result = calculateUser(user.id);




            return (


              <div

                key={user.id}

                className="
                  border
                  rounded-xl
                  p-4
                "

              >


                <div className="
                  flex
                  justify-between
                  items-center
                ">


                  <span className="font-semibold">

                    👤 {user.nome}

                  </span>





                  <span

                    className={

                      result.balance >= 0

                      ?

                      "text-green-600 font-bold"

                      :

                      "text-red-500 font-bold"

                    }

                  >


                    {


                      result.balance >= 0

                      ?

                      "+"

                      :

                      ""

                    }


                    {result.balance.toFixed(2)} €


                  </span>


                </div>







                <div className="
                  text-sm
                  text-gray-500
                  mt-2
                ">


                  <p>

                    Ha pagato:

                    {" "}

                    {result.paid.toFixed(2)} €

                  </p>



                  <p>

                    Quota:

                    {" "}

                    {result.owes.toFixed(2)} €

                  </p>



                </div>



              </div>


            )


          })


        }


      </div>



    </section>


  );


}