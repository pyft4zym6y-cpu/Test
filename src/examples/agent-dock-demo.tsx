"use client";

import { AgentDock } from "@/components/ui/agent-dock";

const avatarSrc =
  "https://api.dicebear.com/10.x/initial-face/svg?seed=Zaraaaa&size=80";

export default function Default() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white p-8">
      <AgentDock
        agentName="Zara"
        avatarSrc={avatarSrc}
        className="w-full max-w-md"
        idleStatus="Your hyperaide"
        onMessageSubmit={async () => {
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }}
        workingStatus="doing stuff..."
      />
    </div>
  );
}
