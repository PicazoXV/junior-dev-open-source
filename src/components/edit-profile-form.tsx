"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import TagAutocompleteInput from "@/components/profile/tag-autocomplete-input";
import { parseTechStack, PROFILE_ROLE_OPTIONS, TECH_STACK_OPTIONS } from "@/lib/profile-options";

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
  roles?: string[] | null;
};

export default function EditProfileForm({ profile }: { profile: Profile }) {
  const { messages } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile.full_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [location, setLocation] = useState(profile.location || "");
  const [roles, setRoles] = useState<string[]>(profile.roles || []);
  const [techStack, setTechStack] = useState<string[]>(parseTechStack(profile.tech_stack));
  const [githubUrl, setGithubUrl] = useState(profile.github_url || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isMissingRolesColumnError = (error: { code?: string; message?: string } | null) => {
    if (!error) return false;
    const code = error.code || "";
    const messageText = (error.message || "").toLowerCase();
    return code === "42703" || messageText.includes("roles");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const payload = {
      full_name: fullName,
      bio,
      location,
      roles,
      tech_stack: techStack.join(", "),
      github_url: githubUrl,
    };

    const firstTry = await supabase.from("profiles").update(payload).eq("id", profile.id);
    const fallbackTry = isMissingRolesColumnError(firstTry.error)
      ? await supabase
          .from("profiles")
          .update({
            full_name: fullName,
            bio,
            location,
            tech_stack: techStack.join(", "),
            github_url: githubUrl,
          })
          .eq("id", profile.id)
      : null;

    const error = fallbackTry?.error || firstTry.error;

    if (error) {
      setMessage(messages.profileEditor.saveError);
      setLoading(false);
      return;
    }

    setMessage(messages.profileEditor.saveSuccess);
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">
          {messages.profileEditor.fullName}
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-xl border border-white/20 bg-neutral-900 px-4 py-2 text-white placeholder:text-gray-500"
          placeholder={messages.profileEditor.fullNamePlaceholder}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">{messages.profileEditor.bio}</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded-xl border border-white/20 bg-neutral-900 px-4 py-2 text-white placeholder:text-gray-500"
          placeholder={messages.profileEditor.bioPlaceholder}
          rows={4}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">
          {messages.profileEditor.location}
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-xl border border-white/20 bg-neutral-900 px-4 py-2 text-white placeholder:text-gray-500"
          placeholder={messages.profileEditor.locationPlaceholder}
        />
      </div>

      <TagAutocompleteInput
        label={messages.profileEditor.position}
        placeholder={messages.profileEditor.positionPlaceholder}
        selected={roles}
        options={PROFILE_ROLE_OPTIONS}
        maxSelected={3}
        limitText={messages.profileEditor.positionMax}
        emptyText={messages.profileEditor.positionEmpty}
        onChange={setRoles}
      />

      <TagAutocompleteInput
        label={messages.profileEditor.techStack}
        placeholder={messages.profileEditor.techStackPlaceholder}
        selected={techStack}
        options={TECH_STACK_OPTIONS}
        maxSelected={10}
        limitText={messages.profileEditor.techStackMax}
        emptyText={messages.profileEditor.techStackEmpty}
        onChange={setTechStack}
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">{messages.profileEditor.githubUrl}</label>
        <input
          type="url"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          className="w-full rounded-xl border border-white/20 bg-neutral-900 px-4 py-2 text-white placeholder:text-gray-500"
          placeholder={messages.profileEditor.githubUrlPlaceholder}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading
          ? messages.profileEditor.saving
          : messages.profileEditor.saveChanges}
      </button>

      {message && (
        <p className={`text-sm ${message === messages.profileEditor.saveError ? "text-rose-300" : "text-emerald-300"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
