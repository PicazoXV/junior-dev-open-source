"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RoadmapModal from "@/components/roadmap/roadmap-modal";

type PostLoginRoadmapProps = {
  userId: string;
};

export default function PostLoginRoadmap({ userId }: PostLoginRoadmapProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const storageKey = useMemo(() => `primerissue:roadmap-guide-dismissed:${userId}`, [userId]);

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey) === "1";
    if (!dismissed) {
      const timeout = window.setTimeout(() => setOpen(true), 0);
      return () => window.clearTimeout(timeout);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleClose = () => {
    localStorage.setItem(storageKey, "1");
    setOpen(false);
    router.push("/dashboard");
    router.refresh();
  };

  return <RoadmapModal open={open} onClose={handleClose} />;
}

