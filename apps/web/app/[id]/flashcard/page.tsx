import FlashcardPageContent from "@/components/dashboard/FlashcardPageContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flashcards",
  description: "Study smarter with spaced repetition flashcards.",
};

export default function FlashcardPage() {
  return <FlashcardPageContent />;
}
