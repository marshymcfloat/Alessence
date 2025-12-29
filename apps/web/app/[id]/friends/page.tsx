import FriendsPageContent from "@/components/dashboard/friends/FriendsPageContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Friends",
  description: "Connect and study with friends on Alessence.",
};

export default function FriendsPage() {
  return <FriendsPageContent />;
}

