import Link from "next/link";
import {
  MessageSquare,
  Zap,
  Code2,
  Sparkles,
  ArrowRight,
  FileCode,
  Blocks,
  Workflow,
  Cpu,
  Rocket,
  Shield,
  GitBranch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl opacity-30" />
      </div>

      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300 shadow-sm">
              <Workflow className="size-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Agent Starter</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild size="sm" className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/chat">
                Try it now
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 pt-24 pb-20 md:pt-40 md:pb-28 relative">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Badge variant="outline" className="px-5 py-2.5 text-sm border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 hover:border-primary/50 transition-colors shadow-sm">
              <Sparkles className="size-4 mr-2 text-primary animate-pulse" />
              <span className="font-medium">AI SDK + AI Elements + Next.js 16</span>
            </Badge>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
            Build AI Agents
            <span className="block bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent mt-4 pb-2">
              In Minutes
            </span>
          </h1>

          <p className="text-xl sm:text-2xl md:text-3xl text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 font-light">
            A polished starter template for building agentic workflows with streaming chat,
            multi-step tool calling, and production-ready architecture.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 mb-16">
            <Button asChild size="lg" className="text-base h-14 px-10 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 transition-all hover:scale-105 font-semibold">
              <Link href="/chat">
                <Rocket className="size-4 mr-2" />
                Start building
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base h-14 px-10 hover:bg-muted/80 border-2 font-semibold hover:scale-105 transition-all">
              <a
                href="https://github.com/vercel/ai"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileCode className="size-4 mr-2" />
                View documentation
              </a>
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            {[
              { label: "TypeScript", icon: Code2 },
              { label: "Streaming Ready", icon: Zap },
              { label: "Multi-Model", icon: Cpu },
              { label: "Production Ready", icon: Shield }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm hover:border-primary/30 transition-colors group">
                <stat.icon className="size-6 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="container mx-auto px-4 sm:px-6 py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="secondary" className="px-4 py-2 text-xs font-semibold tracking-wide uppercase">
              Features
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">
              Everything you need
            </h2>
            <p className="text-muted-foreground text-xl md:text-2xl max-w-2xl mx-auto font-light">
              Production-ready features designed for modern AI applications
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-6 auto-rows-fr">
            {/* Large feature - Streaming Chat */}
            <Card className="group md:col-span-6 lg:col-span-8 lg:row-span-2 hover:border-primary/30 hover:shadow-xl transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="h-full flex flex-col justify-between p-8">
                <div>
                  <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 shadow-lg">
                    <Sparkles className="size-7 text-primary" />
                  </div>
                  <CardTitle className="text-3xl font-bold mb-3">Streaming Chat</CardTitle>
                  <CardDescription className="text-lg leading-relaxed">
                    Real-time AI responses with Vercel AI SDK streaming and typed message parts.
                    Experience lightning-fast interactions with full TypeScript support.
                  </CardDescription>
                </div>
                <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border/50 font-mono text-sm">
                  <div className="text-muted-foreground">// Streaming response</div>
                  <div className="text-foreground">const stream = await chat(prompt)</div>
                </div>
              </CardHeader>
            </Card>

            {/* Medium feature - Multi-Step Tools */}
            <Card className="group md:col-span-3 lg:col-span-4 hover:border-primary/30 hover:shadow-xl transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader className="p-6">
                <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 shadow-lg">
                  <Zap className="size-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold mb-2">Multi-Step Tools</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Built-in tool calling with extensible registry
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Medium feature - AI Elements */}
            <Card className="group md:col-span-3 lg:col-span-4 hover:border-primary/30 hover:shadow-xl transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader className="p-6">
                <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 shadow-lg">
                  <Blocks className="size-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold mb-2">AI Elements</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Pre-built UI components for conversations and citations
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Small feature - Chat Persistence */}
            <Card className="group md:col-span-2 lg:col-span-3 hover:border-primary/30 hover:shadow-xl transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader className="p-6 h-full flex flex-col">
                <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 shadow-lg">
                  <MessageSquare className="size-6 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold mb-2">Persistence</CardTitle>
                <CardDescription className="text-sm">
                  File-based storage with database upgrade path
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Small feature - TypeScript */}
            <Card className="group md:col-span-2 lg:col-span-3 hover:border-primary/30 hover:shadow-xl transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader className="p-6 h-full flex flex-col">
                <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 shadow-lg">
                  <Code2 className="size-6 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold mb-2">TypeScript</CardTitle>
                <CardDescription className="text-sm">
                  Fully typed with Zod schemas
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Small feature - Multi-Model */}
            <Card className="group md:col-span-2 lg:col-span-3 hover:border-primary/30 hover:shadow-xl transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader className="p-6 h-full flex flex-col">
                <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 shadow-lg">
                  <Workflow className="size-6 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold mb-2">Multi-Model</CardTitle>
                <CardDescription className="text-sm">
                  OpenAI, Groq, and AI Gateway support
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Medium wide feature - Production Ready */}
            <Card className="group md:col-span-6 lg:col-span-5 hover:border-primary/30 hover:shadow-xl transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader className="p-6">
                <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 shadow-lg">
                  <Shield className="size-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold mb-2">Production Ready</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Built with best practices, error handling, and scalability in mind
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* See it in Action */}
      <section className="container mx-auto px-4 sm:px-6 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="secondary" className="px-4 py-2 text-xs font-semibold tracking-wide uppercase">
              Demo
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">
              See it in action
            </h2>
            <p className="text-muted-foreground text-xl md:text-2xl max-w-2xl mx-auto font-light">
              Watch how the agent handles complex workflows with streaming responses
            </p>
          </div>

          <Card className="overflow-hidden border-2 border-border/50 shadow-2xl bg-gradient-to-br from-card to-card/50">
            <div className="bg-muted/30 border-b border-border/50 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-2">
                <div className="size-3 rounded-full bg-red-500/80" />
                <div className="size-3 rounded-full bg-yellow-500/80" />
                <div className="size-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs font-medium text-muted-foreground ml-2">Agent Chat</span>
            </div>
            <CardHeader className="p-8 md:p-12 space-y-6">
              {/* Chat messages preview */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="size-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3">
                      <p className="text-sm">What's the weather in San Francisco and what time is it there?</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="size-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1.5 text-xs font-medium text-primary">
                      <Zap className="size-3" />
                      Using tools: getWeather, getTime
                    </div>
                    <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl rounded-tl-sm px-4 py-3 border border-border/50">
                      <p className="text-sm leading-relaxed">
                        In San Francisco, it's currently <span className="font-semibold">72°F and sunny</span>. The local time is <span className="font-semibold">2:45 PM PST</span>. Perfect weather for a walk outside!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <div className="flex-1 bg-muted/30 rounded-full px-4 py-2.5 text-sm text-muted-foreground">
                  Try asking something...
                </div>
                <Button size="sm" className="rounded-full">
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="mt-8 text-center">
            <Button asChild variant="outline" size="lg" className="font-semibold">
              <Link href="/chat">
                Try the live demo
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Easy to Add Tools */}
      <section className="container mx-auto px-4 sm:px-6 py-24 md:py-32 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="px-4 py-2 text-xs font-semibold tracking-wide uppercase">
                Developer Experience
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                Add new tools in seconds
              </h2>
              <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
                Extend your agent with custom tools using a simple, type-safe API.
                Define your tool schema with Zod and implement the handler—that's it.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg">
                  <Link href="/chat">
                    <Code2 className="size-4 mr-2" />
                    Start building
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="https://ai-sdk.dev" target="_blank" rel="noopener noreferrer">
                    Read the docs
                    <FileCode className="size-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden border-2 border-border/50 shadow-xl">
              <div className="bg-muted/50 border-b border-border/50 px-4 py-2 flex items-center gap-2">
                <FileCode className="size-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">tools/weather.ts</span>
              </div>
              <CardHeader className="p-6 bg-gradient-to-br from-card to-card/50">
                <pre className="text-xs md:text-sm overflow-x-auto">
                  <code className="language-typescript">
{`export const weatherTool = {
  name: 'getWeather',
  description: 'Get weather for a location',
  parameters: z.object({
    location: z.string()
      .describe('City name'),
  }),
  execute: async ({ location }) => {
    const weather = await fetchWeather(location);
    return {
      temperature: weather.temp,
      condition: weather.condition,
    };
  }
};`}
                  </code>
                </pre>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="container mx-auto px-4 sm:px-6 py-24 md:py-32">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="secondary" className="px-4 py-2 text-xs font-semibold tracking-wide uppercase">
              Tech Stack
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Built with modern tools</h2>
            <p className="text-muted-foreground text-xl md:text-2xl font-light">
              Powered by the latest technologies for maximum performance
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-5">
            {[
              { name: "Next.js 16", icon: GitBranch },
              { name: "React 19", icon: Code2 },
              { name: "Vercel AI SDK", icon: Cpu },
              { name: "AI Elements", icon: Blocks },
              { name: "TypeScript", icon: Code2 },
              { name: "Tailwind CSS", icon: Sparkles },
              { name: "shadcn/ui", icon: Blocks },
              { name: "Zod", icon: Shield },
            ].map((tech) => (
              <Badge
                key={tech.name}
                variant="secondary"
                className="px-6 py-3.5 text-sm font-semibold hover:bg-primary/10 hover:text-primary hover:border-primary/20 hover:scale-110 transition-all cursor-default shadow-md hover:shadow-lg backdrop-blur-sm border group"
              >
                <tech.icon className="size-4 mr-2 group-hover:rotate-12 transition-transform" />
                {tech.name}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 py-24 md:py-32">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/15 via-primary/8 to-background/50 p-16 md:p-24 text-center overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-500 backdrop-blur-sm group">
            <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(white,transparent_80%)]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/25 rounded-full blur-3xl opacity-30 group-hover:opacity-40 transition-opacity" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl" />

            <div className="relative space-y-10">
              <div className="space-y-6">
                <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                  <Rocket className="size-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Start your journey</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text">
                  Ready to build?
                </h2>
                <p className="text-xl md:text-2xl text-muted-foreground/90 max-w-2xl mx-auto leading-relaxed font-light">
                  Start creating powerful AI agents with our production-ready starter template. Ship faster, build better.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button asChild size="lg" className="h-16 px-12 shadow-2xl shadow-primary/30 hover:shadow-3xl hover:shadow-primary/50 transition-all text-lg font-bold hover:scale-105 group/button">
                  <Link href="/chat">
                    <Rocket className="size-5 mr-2 group-hover/button:translate-x-0.5 group-hover/button:-translate-y-0.5 transition-transform" />
                    Get started free
                    <ArrowRight className="size-5 ml-1 group-hover/button:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-16 px-12 text-lg font-bold border-2 hover:bg-background/50 backdrop-blur-sm hover:scale-105 transition-all">
                  <a
                    href="https://github.com/vercel/ai"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GitBranch className="size-5 mr-2" />
                    View on GitHub
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-gradient-to-b from-muted/30 to-muted/50 backdrop-blur-md mt-24">
        <div className="container mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg">
                <Workflow className="size-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base">Agent Starter</span>
                <span className="text-muted-foreground text-xs">Built with Vercel AI SDK</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-10 text-sm font-semibold">
              <a
                href="https://ai-sdk.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4 flex items-center gap-2 group"
              >
                <FileCode className="size-4 group-hover:scale-110 transition-transform" />
                AI SDK Docs
              </a>
              <a
                href="https://ai-sdk.dev/elements"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4 flex items-center gap-2 group"
              >
                <Blocks className="size-4 group-hover:scale-110 transition-transform" />
                AI Elements
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4 flex items-center gap-2 group"
              >
                <GitBranch className="size-4 group-hover:scale-110 transition-transform" />
                GitHub
              </a>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/30 text-center">
            <p className="text-xs text-muted-foreground">
              Made with{" "}
              <span className="text-red-500 animate-pulse inline-block">♥</span>{" "}
              using Next.js 16, React 19, and Vercel AI SDK
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
