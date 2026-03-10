"use client";

import Badge from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/client";
import { getStatusLabel } from "@/lib/i18n/labels";

type TaskStatus = "open" | "assigned" | "in_review" | "completed" | "closed";
type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";
type Status = TaskStatus | RequestStatus;

const tones: Record<Status, "default" | "success" | "warning" | "danger" | "info"> = {
  open: "info",
  assigned: "warning",
  in_review: "warning",
  completed: "success",
  closed: "default",
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "default",
};

type StatusBadgeProps = {
  status: Status;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { locale } = useI18n();

  return <Badge tone={tones[status]}>{getStatusLabel(status, locale)}</Badge>;
}
