"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import { supabase } from "@/lib/supabase";

export default function MediaUpload({
  eventId,
  userId,
  reload,
}: {
  eventId: string;
  userId: string;
  reload: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function uploadFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;

    if (!files || files.length === 0) {
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const fileList = Array.from(files);

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const isImage = file.type.startsWith("image");
        const tipo = file.type.startsWith("video") ? "video" : "foto";

        let fileToUpload = file;

        // 🗜️ Compressione automatica se si tratta di un'immagine
        if (isImage) {
          setMessage(`🗜️ Compressione foto ${i + 1}/${fileList.length}...`);

          const options = {
            maxSizeMB: 0.4,          // Riduce il peso a massimo ~400 KB (risparmio fino al 90-95%)
            maxWidthOrHeight: 1920,  // Risoluzione Full HD
            useWebWorker: true,      // Non blocca l'interfaccia utente durante l'elaborazione
          };

          try {
            fileToUpload = await imageCompression(file, options);
          } catch (compressError) {
            console.warn("Impossibile comprimere l'immagine, carico l'originale:", compressError);
          }
        }

        setMessage(`🚀 Caricamento ${i + 1}/${fileList.length}...`);

        const extension = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${extension}`;
        const path = `${eventId}/${fileName}`;

        // 1. Upload del file (compresso se foto, originale se video) su Storage
        const { error: uploadError } = await supabase.storage
          .from("event-media")
          .upload(path, fileToUpload);

        if (uploadError) {
          throw uploadError;
        }

        // 2. Inserimento del record nel Database
        const { error: dbError } = await supabase.from("media").insert({
          event_id: eventId,
          user_id: userId,
          tipo,
          url: path,
          nome_file: file.name,
        });

        if (dbError) {
          throw dbError;
        }
      }

      setMessage("✅ Caricamento completato");
      reload();
    } catch (error: any) {
      console.log(error);
      setMessage("❌ Errore: " + error.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <label className="block w-full bg-black text-white text-center rounded-xl p-4 cursor-pointer font-semibold">
        {uploading ? "⏳ Caricamento..." : "📸 Carica foto/video"}

        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={uploadFiles}
          className="hidden"
        />
      </label>

      {message && <p className="mt-3 text-center text-sm">{message}</p>}
    </div>
  );
}