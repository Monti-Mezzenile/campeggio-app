// app/profile/cars/new/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/ui/BackButton";
export default function NewCarPage() {

  const router = useRouter();

  const [modello, setModello] = useState("");
  const [posti, setPosti] = useState("");
  const [partenza, setPartenza] = useState("");
  const [note, setNote] = useState("");

  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const [saving, setSaving] = useState(false);

  async function saveCar() {

    if (!modello || !posti) {
      alert("Inserisci almeno modello e posti disponibili");
      return;
    }

    setSaving(true);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      return;
    }

    let fotoUrl: string | null = null;

    if (foto) {

      const extension = foto.name.split(".").pop();

      const fileName =
        `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("cars")
        .upload(fileName, foto);

      if (uploadError) {
        alert(uploadError.message);
        setSaving(false);
        return;
      }

      const { data } = supabase.storage
        .from("cars")
        .getPublicUrl(fileName);

      fotoUrl = data.publicUrl;
    }

    const { error } = await supabase
      .from("cars")
      .insert({

        user_id: user.id,

        modello,

        posti_totali: Number(posti),

        partenza_predefinita:
          partenza || null,

        note:
          note || null,

        foto: fotoUrl

      });

    if (error) {

      console.log(error);

      alert(error.message);

      setSaving(false);

      return;
    }

    router.push("/profile/cars");
  }

  return (

    <main
      className="
      p-6
      pb-28
      max-w-3xl
      mx-auto
    "
    >
      <BackButton label="I miei mezzi" />
      <h1
        className="
        text-3xl
        font-bold
        mb-6
      "
      >
        🚗 Aggiungi mezzo
      </h1>

      <div
        className="
        bg-white
        border
        rounded-2xl
        p-5
        flex
        flex-col
        gap-4
      "
      >

        <div>

          <label className="text-sm text-gray-500">
            Foto del mezzo
          </label>

          <input
            type="file"
            accept="image/*"
            className="mt-2"
            onChange={(e) => {

              const file = e.target.files?.[0];

              if (!file) return;

              setFoto(file);

              setPreview(
                URL.createObjectURL(file)
              );

            }}
          />

        </div>

        {

          preview &&

          <img
            src={preview}
            className="
              w-full
              h-56
              object-contain
              rounded-xl
              border
            "
          />

        }

        <div>

          <label className="text-sm text-gray-500">
            Modello
          </label>

          <input
            value={modello}
            onChange={(e) => setModello(e.target.value)}
            placeholder="Es. Fiat Panda"
            className="
              w-full
              border
              rounded-xl
              p-3
              mt-1
            "
          />

        </div>

        <div>

          <label className="text-sm text-gray-500">
            Posti disponibili
          </label>

          <input
            type="number"
            min="1"
            value={posti}
            onChange={(e) => setPosti(e.target.value)}
            placeholder="Es. 3"
            className="
              w-full
              border
              rounded-xl
              p-3
              mt-1
            "
          />

          <p
            className="
            text-xs
            text-gray-500
            mt-2
          "
          >
            Numero di passeggeri che puoi ospitare (tu sei già il conducente)
          </p>

        </div>

        <div>

          <label className="text-sm text-gray-500">
            Partenza abituale
          </label>

          <input
            value={partenza}
            onChange={(e) => setPartenza(e.target.value)}
            placeholder="Es. Torino"
            className="
              w-full
              border
              rounded-xl
              p-3
              mt-1
            "
          />

        </div>

        <div>

          <label className="text-sm text-gray-500">
            Note
          </label>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Es. Ho il portapacchi"
            className="
              w-full
              border
              rounded-xl
              p-3
              mt-1
            "
          />

        </div>

        <button
          disabled={saving}
          onClick={saveCar}
          className="
            bg-black
            text-white
            rounded-xl
            p-4
            mt-3
            disabled:opacity-50
          "
        >

          {

            saving

              ? "Salvataggio..."

              : "🚗 Salva mezzo"

          }

        </button>

      </div>

    </main>

  );

}