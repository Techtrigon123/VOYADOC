import { redirect } from "next/navigation";

/** Settings now live on the Edit profile page. */
export default function SettingsPage() {
  redirect("/dashboard/profile/edit");
}
