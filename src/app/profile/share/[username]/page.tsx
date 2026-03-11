import { permanentRedirect, redirect } from "next/navigation";

type ShareProfileRedirectPageProps = {
  params: Promise<{ username: string }>;
};

export default async function ShareProfileRedirectPage({
  params,
}: ShareProfileRedirectPageProps) {
  const { username } = await params;
  const normalizedUsername =
    typeof username === "string" ? username.trim().toLowerCase() : "";

  if (!normalizedUsername) {
    redirect("/developers");
  }

  permanentRedirect(`/dev/${encodeURIComponent(normalizedUsername)}`);
}
