"use client";

import { useMemo, useState, useTransition } from "react";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { FavoriteItemType } from "@/lib/favorites";
import { useI18n } from "@/lib/i18n/client";

type FavoriteToggleProps = {
  itemType: FavoriteItemType;
  itemId: string;
  initiallyFavorite: boolean;
  size?: "sm" | "md";
};

export default function FavoriteToggle({
  itemType,
  itemId,
  initiallyFavorite,
  size = "sm",
}: FavoriteToggleProps) {
  const { locale } = useI18n();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isFavorite, setIsFavorite] = useState(initiallyFavorite);
  const [isPending, startTransition] = useTransition();

  const label = isFavorite
    ? locale === "en"
      ? "Remove favorite"
      : "Quitar favorito"
    : locale === "en"
      ? "Save favorite"
      : "Guardar favorito";

  const toggle = () => {
    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("item_type", itemType)
          .eq("item_id", itemId);

        if (!error) {
          setIsFavorite(false);
          router.refresh();
        }
        return;
      }

      const { error } = await supabase.from("favorites").insert({
        user_id: user.id,
        item_type: itemType,
        item_id: itemId,
      });

      if (!error) {
        setIsFavorite(true);
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={toggle}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 ${
        size === "sm" ? "py-1.5 text-xs" : "py-2 text-sm"
      } transition ${
        isFavorite
          ? "border-orange-500/40 bg-orange-500/10 text-orange-300"
          : "border-white/20 bg-neutral-900 text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
      }`}
      title={label}
      aria-label={label}
    >
      <Star className={`h-4 w-4 ${isFavorite ? "fill-orange-300" : ""}`} />
      <span>{label}</span>
    </button>
  );
}
