"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge";
import TagAutocompleteInput from "@/components/profile/tag-autocomplete-input";
import { PROFILE_ROLE_OPTIONS, TECH_STACK_OPTIONS } from "@/lib/profile-options";
import { updateDashboardProfileAction } from "@/app/dashboard/actions";
import { useI18n } from "@/lib/i18n/client";

type DashboardProfileEditorProps = {
  bio: string | null;
  location: string | null;
  roles: string[];
  techStack: string[];
  initialEditing?: boolean;
};

export default function DashboardProfileEditor({
  bio,
  location,
  roles,
  techStack,
  initialEditing = false,
}: DashboardProfileEditorProps) {
  const { locale, messages } = useI18n();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<"idle" | "success" | "error">("idle");

  const [savedBio, setSavedBio] = useState(bio || "");
  const [savedLocation, setSavedLocation] = useState(location || "");
  const [savedRoles, setSavedRoles] = useState<string[]>(roles || []);
  const [savedTechStack, setSavedTechStack] = useState<string[]>(techStack || []);

  const [bioValue, setBioValue] = useState(savedBio);
  const [locationValue, setLocationValue] = useState(savedLocation);
  const [rolesValue, setRolesValue] = useState<string[]>(savedRoles);
  const [techStackValue, setTechStackValue] = useState<string[]>(savedTechStack);

  useEffect(() => {
    if (initialEditing) {
      const anchor = document.getElementById("dashboard-profile-editor");
      anchor?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [initialEditing]);

  const editLabel = locale === "en" ? "Edit profile" : "Editar perfil";
  const saveLabel = locale === "en" ? "Save profile" : "Guardar perfil";
  const cancelLabel = locale === "en" ? "Cancel" : "Cancelar";
  const emptyBioLabel = locale === "en" ? "You have not added a bio yet." : "Todavía no has añadido una bio.";
  const emptyLocationLabel = locale === "en" ? "Not specified" : "No especificada";

  const statusMessage = useMemo(() => {
    if (feedback === "success") {
      return {
        tone: "success" as const,
        text: messages.profileEditor.saveSuccess,
      };
    }

    if (feedback === "error") {
      return {
        tone: "danger" as const,
        text: messages.profileEditor.saveError,
      };
    }

    return null;
  }, [feedback, messages.profileEditor.saveError, messages.profileEditor.saveSuccess]);

  const handlePrimaryAction = () => {
    if (!isEditing) {
      setIsEditing(true);
      setFeedback("idle");
      return;
    }

    startTransition(async () => {
      const result = await updateDashboardProfileAction({
        bio: bioValue,
        location: locationValue,
        roles: rolesValue,
        techStack: techStackValue,
      });

      if (!result.ok || !result.profile) {
        setFeedback("error");
        return;
      }

      const nextBio = result.profile.bio || "";
      const nextLocation = result.profile.location || "";
      const nextRoles = result.profile.roles;
      const nextTechStack = result.profile.techStack;

      setSavedBio(nextBio);
      setSavedLocation(nextLocation);
      setSavedRoles(nextRoles);
      setSavedTechStack(nextTechStack);
      setBioValue(nextBio);
      setLocationValue(nextLocation);
      setRolesValue(nextRoles);
      setTechStackValue(nextTechStack);
      setFeedback("success");
      setIsEditing(false);
      router.refresh();
    });
  };

  const handleCancel = () => {
    setBioValue(savedBio);
    setLocationValue(savedLocation);
    setRolesValue(savedRoles);
    setTechStackValue(savedTechStack);
    setFeedback("idle");
    setIsEditing(false);
  };

  return (
    <div id="dashboard-profile-editor" className="surface-card mt-6 rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-300">
          {locale === "en" ? "Profile details" : "Datos de perfil"}
        </p>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:border-white/35 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={isPending}
            className={`inline-flex rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${
              isEditing
                ? "border-emerald-500/45 bg-emerald-500/15 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20"
                : "border-orange-500/40 bg-orange-500/10 text-orange-300 hover:border-orange-400 hover:bg-orange-500/15"
            }`}
          >
            {isEditing ? (isPending ? messages.profileEditor.saving : saveLabel) : editLabel}
          </button>
        </div>
      </div>

      {statusMessage ? (
        <div className="mb-4">
          <Badge tone={statusMessage.tone}>{statusMessage.text}</Badge>
        </div>
      ) : null}

      {isEditing ? (
        <div className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              {messages.profileEditor.bio}
            </label>
            <textarea
              value={bioValue}
              onChange={(event) => setBioValue(event.target.value)}
              className="surface-subcard w-full rounded-xl border border-white/20 px-4 py-2 text-white placeholder:text-gray-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
              placeholder={messages.profileEditor.bioPlaceholder}
              rows={4}
              maxLength={600}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              {messages.profileEditor.location}
            </label>
            <input
              type="text"
              value={locationValue}
              onChange={(event) => setLocationValue(event.target.value)}
              className="surface-subcard w-full rounded-xl border border-white/20 px-4 py-2 text-white placeholder:text-gray-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
              placeholder={messages.profileEditor.locationPlaceholder}
              maxLength={120}
            />
          </div>

          <TagAutocompleteInput
            label={messages.profileEditor.position}
            placeholder={messages.profileEditor.positionPlaceholder}
            selected={rolesValue}
            options={PROFILE_ROLE_OPTIONS}
            maxSelected={3}
            limitText={messages.profileEditor.positionMax}
            emptyText={messages.profileEditor.positionEmpty}
            onChange={setRolesValue}
          />

          <TagAutocompleteInput
            label={messages.profileEditor.techStack}
            placeholder={messages.profileEditor.techStackPlaceholder}
            selected={techStackValue}
            options={TECH_STACK_OPTIONS}
            maxSelected={10}
            limitText={messages.profileEditor.techStackMax}
            emptyText={messages.profileEditor.techStackEmpty}
            onChange={setTechStackValue}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="surface-subcard rounded-xl p-4 md:col-span-2">
            <p className="text-sm text-gray-400">{messages.profileEditor.bio}</p>
            <p className="mt-2 text-gray-200">{bioValue || emptyBioLabel}</p>
          </div>

          <div className="surface-subcard rounded-xl p-4">
            <p className="text-sm text-gray-400">{messages.profileEditor.location}</p>
            <p className="mt-2 text-gray-200">{locationValue || emptyLocationLabel}</p>
          </div>

          <div className="surface-subcard rounded-xl p-4">
            <p className="text-sm text-gray-400">{messages.profileEditor.position}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {rolesValue.length > 0 ? (
                rolesValue.map((role) => <Badge key={role}>{role}</Badge>)
              ) : (
                <span className="text-sm text-gray-500">{messages.profileEditor.positionEmpty}</span>
              )}
            </div>
          </div>

          <div className="surface-subcard rounded-xl p-4 md:col-span-2">
            <p className="text-sm text-gray-400">{messages.profileEditor.techStack}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {techStackValue.length > 0 ? (
                techStackValue.map((tech) => <Badge key={tech}>{tech}</Badge>)
              ) : (
                <span className="text-sm text-gray-500">{messages.profileEditor.techStackEmpty}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
