"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  email: string | null;
  github_username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  bio?: string | null;
  location?: string | null;
  tech_stack?: string | null;
  github_url?: string | null;
  
};

export default function EditProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile.full_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [location, setLocation] = useState(profile.location || "");
  const [techStack, setTechStack] = useState(profile.tech_stack || "");
  const [githubUrl, setGithubUrl] = useState(profile.github_url || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        bio,
        location,
        tech_stack: techStack,
        github_url: githubUrl,
      })
      .eq("id", profile.id);

    if (error) {
      setMessage("Error al guardar los cambios");
      setLoading(false);
      return;
    }

    setMessage("Perfil actualizado correctamente");
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">Nombre completo</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-xl border px-4 py-2"
          placeholder="Tu nombre"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded-xl border px-4 py-2"
          placeholder="Cuéntanos algo sobre ti"
          rows={4}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">Ubicación</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-xl border px-4 py-2"
          placeholder="Madrid, España"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">Tech stack</label>
        <input
          type="text"
          value={techStack}
          onChange={(e) => setTechStack(e.target.value)}
          className="w-full rounded-xl border px-4 py-2"
          placeholder="React, Next.js, TypeScript"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">GitHub URL</label>
        <input
          type="url"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          className="w-full rounded-xl border px-4 py-2"
          placeholder="https://github.com/tuusuario"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>

      {message && (
        <p className={`text-sm ${message.includes("Error") ? "text-rose-300" : "text-emerald-300"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
