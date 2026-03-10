import Badge from "@/components/ui/badge";

type TaskStatus = "open" | "assigned" | "in_review" | "completed" | "closed";
type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";
type Status = TaskStatus | RequestStatus;

const labels: Record<Status, string> = {
  open: "Abierta",
  assigned: "Asignada",
  in_review: "En revisión",
  completed: "Completada",
  closed: "Cerrada",
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
};

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
  return <Badge tone={tones[status]}>{labels[status]}</Badge>;
}
