import { redirect } from "next/navigation";

export default function LegacyEditProfilePage() {
  redirect("/dashboard?editProfile=1");
}
