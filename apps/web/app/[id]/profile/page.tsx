import ProfilePageContent from "@/components/dashboard/profile/ProfilePageContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return <ProfilePageContent />;
}

