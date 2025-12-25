import { redirect } from "next/navigation";

import { createChat } from "@/lib/chat/server/fileChatStore";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Terminal, Code2, ExternalLink } from "lucide-react";

export default async function ChatPage() {
  // Check if API keys are configured
  const hasApiKey = !!(process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.AI_GATEWAY_API_KEY);

  // If no API key is set, show setup instructions
  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-2 shadow-xl">
          <CardHeader className="space-y-6 p-8 md:p-12">
            <div className="flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg">
                <Terminal className="size-12 text-primary" />
              </div>
            </div>

            <div className="text-center space-y-3">
              <CardTitle className="text-3xl md:text-4xl font-black">
                API Key Required
              </CardTitle>
              <CardDescription className="text-lg leading-relaxed">
                To use the chat, you'll need to set up your own API keys locally.
              </CardDescription>
            </div>

            <div className="space-y-4 bg-muted/50 rounded-xl p-6 text-sm font-mono">
              <div className="space-y-2">
                <p className="text-muted-foreground font-semibold">Quick Setup:</p>
                <div className="space-y-1 text-foreground/90">
                  <p>1. Clone the repository</p>
                  <p>2. Copy <code className="bg-muted px-2 py-0.5 rounded">.env.example</code> to <code className="bg-muted px-2 py-0.5 rounded">.env.local</code></p>
                  <p>3. Add your <code className="bg-muted px-2 py-0.5 rounded">OPENAI_API_KEY</code></p>
                  <p>4. Run <code className="bg-muted px-2 py-0.5 rounded">pnpm dev</code></p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild size="lg" className="flex-1 font-semibold">
                <a
                  href="https://github.com/thorchh/agent-starter"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Code2 className="size-4 mr-2" />
                  Clone Repository
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="flex-1 font-semibold">
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-4 mr-2" />
                  Get API Key
                </a>
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Docs-aligned: always create a new chat and redirect to /chat/[id].
  // Ref: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
  const id = await createChat();
  redirect(`/chat/${id}`);
}