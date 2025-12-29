import AiAssistantContent from "@/components/dashboard/assistant/AiAssistantContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Assistant",
  description: "Get help with your studies from your AI assistant.",
};

export default function AssistantPage() {
  return <AiAssistantContent />;
}

