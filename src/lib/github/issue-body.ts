type BuildIssueBodyParams = {
  taskId: string;
  taskTitle: string | null;
  taskDescription: string | null;
  projectName: string | null;
  projectSlug: string | null;
  assignedGithubUsername: string | null;
  approvedByUserId: string;
};

function buildPlatformTaskUrl(taskId: string) {
  const baseUrl = process.env.PLATFORM_BASE_URL?.trim();
  if (!baseUrl) {
    return null;
  }

  try {
    return new URL(`/tasks/${taskId}`, baseUrl).toString();
  } catch {
    return null;
  }
}

export function buildTaskIssueTitle(taskTitle: string | null) {
  const title = taskTitle?.trim() || "Nueva tarea asignada";
  return `[Task] ${title}`;
}

export function buildTaskIssueBody(params: BuildIssueBodyParams) {
  const taskUrl = buildPlatformTaskUrl(params.taskId);
  const projectLabel = params.projectName || params.projectSlug || "Proyecto sin nombre";
  const assignee = params.assignedGithubUsername
    ? `@${params.assignedGithubUsername}`
    : "No disponible";

  const lines = [
    "## Task creada desde Junior Dev Open Source",
    "",
    "Esta issue fue generada automáticamente al aprobar una solicitud en la plataforma.",
    "",
    "### Contexto",
    `- Proyecto: **${projectLabel}**`,
    `- Developer asignado: **${assignee}**`,
    `- Referencia interna task_id: \`${params.taskId}\``,
    `- Aprobado por user_id: \`${params.approvedByUserId}\``,
    ...(taskUrl ? [`- Tarea en plataforma: ${taskUrl}`] : []),
    "",
    "### Descripción de la tarea",
    params.taskDescription?.trim() || "Sin descripción proporcionada en la plataforma.",
    "",
    "### Pasos sugeridos para empezar",
    "1. Revisa el contexto y alcance de esta tarea.",
    "2. Sincroniza la rama principal del repositorio.",
    "3. Implementa una solución mínima y verificable.",
    "4. Añade pruebas o validación si aplica.",
    "",
    "### Flujo recomendado",
    "`fork` → `branch` → `pull request`",
    "",
    "_Issue generada automáticamente por Junior Dev Open Source._",
  ];

  return lines.join("\n");
}
