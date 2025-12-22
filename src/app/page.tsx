import Link from "next/link";
import {
  MessageSquare,
  Zap,
  Code2,
  Sparkles,
  ArrowRight,
  FileCode,
  Blocks,
  Workflow
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity group">
            <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
              <Workflow className="size-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">Agent Starter</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild size="sm" className="shadow-sm">
              <Link href="/chat">
                Try it now
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 pt-24 pb-20 md:pt-40 md:pb-28">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Badge variant="outline" className="px-4 py-2 text-sm border-primary/20 bg-primary/5">
              <Sparkles className="size-3.5 mr-2 text-primary" />
              AI SDK + AI Elements + Next.js
            </Badge>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
            Build AI Agents
            <span className="block bg-linear-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent mt-3">
              In Minutes
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            A polished starter template for building agentic workflows with streaming chat,
            multi-step tool calling, and production-ready architecture.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <Button asChild size="lg" className="text-base h-12 px-8 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
              <Link href="/chat">
                Start chatting
                <MessageSquare className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base h-12 px-8 hover:bg-muted/50">
              <a
                href="https://github.com/vercel/ai"
                target="_blank"
                rel="noopener noreferrer"
              >
                View docs
                <FileCode className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 sm:px-6 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Everything you need</h2>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
              Production-ready features out of the box
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <Card className="group hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/40 bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-4">
                <div className="size-14 rounded-xl bg-linear-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300">
                  <Sparkles className="size-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-semibold">Streaming Chat</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Real-time AI responses with Vercel AI SDK streaming and typed message parts
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="group hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/40 bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-4">
                <div className="size-14 rounded-xl bg-linear-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300">
                  <Zap className="size-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-semibold">Multi-Step Tools</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Built-in tool calling with weather, time, attachments, and extensible tool registry
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="group hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/40 bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-4">
                <div className="size-14 rounded-xl bg-linear-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300">
                  <Blocks className="size-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-semibold">AI Elements</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Pre-built UI components for conversations, citations, attachments, and more
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="group hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/40 bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-4">
                <div className="size-14 rounded-xl bg-linear-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300">
                  <MessageSquare className="size-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-semibold">Chat Persistence</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    File-based storage for local dev, easy upgrade path to database persistence
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="group hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/40 bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-4">
                <div className="size-14 rounded-xl bg-linear-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300">
                  <Code2 className="size-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-semibold">TypeScript First</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Fully typed with TypeScript, Zod schemas, and comprehensive type safety
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="group hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/40 bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-4">
                <div className="size-14 rounded-xl bg-linear-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300">
                  <Workflow className="size-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-semibold">Multi-Model</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Support for OpenAI, Groq, and AI Gateway with easy provider switching
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="container mx-auto px-4 sm:px-6 py-20 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built with modern tools</h2>
            <p className="text-muted-foreground text-lg">
              Powered by the latest technologies
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {[
              "Next.js 16",
              "React 19",
              "Vercel AI SDK",
              "AI Elements",
              "TypeScript",
              "Tailwind CSS",
              "shadcn/ui",
              "Zod",
            ].map((tech) => (
              <Badge
                key={tech}
                variant="secondary"
                className="px-5 py-2.5 text-sm font-medium hover:bg-secondary/80 hover:scale-105 transition-all cursor-default shadow-sm"
              >
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 py-20 md:py-28">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl border border-primary/10 bg-linear-to-br from-primary/10 via-primary/5 to-background p-12 md:p-20 text-center overflow-hidden shadow-2xl shadow-primary/10">
            <div className="absolute inset-0 bg-grid-white/5 mask-[radial-gradient(white,transparent_85%)]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20" />
            <div className="relative space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Ready to build?</h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Start creating powerful AI agents with our production-ready starter template.
                </p>
              </div>
              <div className="pt-2">
                <Button asChild size="lg" className="h-14 px-10 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all text-lg font-semibold">
                  <Link href="/chat">
                    Get started
                    <ArrowRight className="size-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Workflow className="size-4 text-primary" />
              </div>
              <span className="font-medium">Built with Vercel AI SDK and AI Elements</span>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm font-medium">
              <a
                href="https://ai-sdk.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                AI SDK Docs
              </a>
              <a
                href="https://ai-sdk.dev/elements"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                AI Elements
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
