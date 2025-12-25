import Link from "next/link";
import {
  Zap,
  Code2,
  Sparkles,
  ArrowRight,
  FileCode,
  Blocks,
  Workflow,
  Cpu,
  Rocket,
  PlayCircle,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ScrollText } from "@/components/scroll-text";
import {
  siGithub,
  siNextdotjs,
  siReact,
  siTypescript,
  siTailwindcss,
  siVercel,
  siZod,
  siShadcnui,
} from "simple-icons";

// Custom OpenAI icon path (since it's not in simple-icons)
const openaiIcon = {
  path: "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
};

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
            Build Agentic AI Apps
            <span className="block bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent mt-4 pb-2">
              In Minutes
            </span>
          </h1>

          <ScrollText className="text-xl sm:text-2xl md:text-3xl text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-12 font-light">
            Production-ready AI agents with zero setup. Agentic workflows, streaming chat, and polished UI - fully integrated and ready to ship.
          </ScrollText>

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
                href="https://github.com/thorchh/agent-starter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg role="img" viewBox="0 0 24 24" className="size-4 mr-2 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d={siGithub.path} />
                </svg>
                View on GitHub
              </a>
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            {[
              { label: "Agentic Workflows", icon: Bot },
              { label: "UI Components", icon: Blocks },
              { label: "Multi-Step Tools", icon: Zap },
              { label: "Ready to Deploy", icon: Rocket }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm hover:border-primary/30 transition-colors group">
                <stat.icon className="size-6 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</span>
              </div>
            ))}
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
              Watch how agents handle complex workflows with streaming responses
            </p>
          </div>

          {/* Video/Image Placeholder */}
          <div className="relative group">
            <Card className="overflow-hidden border-2 border-border/50 shadow-2xl bg-gradient-to-br from-card to-card/50">
              <div className="aspect-video bg-gradient-to-br from-muted via-muted/50 to-muted/30 flex items-center justify-center relative overflow-hidden">
                {/* Placeholder content */}
                <div className="absolute inset-0 bg-grid-white/[0.02]" />
                <div className="relative z-10 text-center space-y-6 p-8">
                  <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-primary/10 border-2 border-primary/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                    <PlayCircle className="size-10 text-primary fill-primary/20" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">Interactive Demo Video</p>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      See multi-step reasoning, tool calling, and streaming responses in real-time
                    </p>
                  </div>
                </div>
                {/* Replace this div with: <video> or <Image> component */}
              </div>
            </Card>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="font-semibold">
                <Link href="/chat">
                  <Rocket className="size-4 mr-2" />
                  Try live demo
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-semibold">
                <a href="https://github.com/thorchh/agent-starter" target="_blank" rel="noopener noreferrer">
                  <svg role="img" viewBox="0 0 24 24" className="size-4 mr-2 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d={siGithub.path} />
                  </svg>
                  View on GitHub
                </a>
              </Button>
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Large feature - Agentic Workflows */}
            <Card className="group md:col-span-6 lg:col-span-7 lg:row-span-2 hover:border-primary/30 hover:shadow-xl transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="h-full flex flex-col justify-between p-8">
                <div>
                  <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 shadow-lg">
                    <Bot className="size-7 text-primary" />
                  </div>
                  <CardTitle className="text-3xl font-bold mb-3">Agentic Workflows</CardTitle>
                  <CardDescription className="text-lg leading-relaxed mb-4">
                    Multi-step reasoning with tool execution, branching logic, and autonomous decision-making.
                    Build agents that think and act independently.
                  </CardDescription>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">Multi-step</Badge>
                    <Badge variant="secondary" className="text-xs">Tool calling</Badge>
                    <Badge variant="secondary" className="text-xs">Autonomous</Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Tall feature - Pre-built UI */}
            <Card className="group md:col-span-3 lg:col-span-5 lg:row-span-2 hover:border-primary/30 hover:shadow-xl transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader className="h-full p-8">
                <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 shadow-lg">
                  <Blocks className="size-7 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold mb-3">Pre-built UI Components</CardTitle>
                <CardDescription className="text-base leading-relaxed mb-6">
                  Polished chat interface, message bubbles, typing indicators, and tool execution visualizations - ready to use.
                </CardDescription>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-primary" />
                    <span>Chat UI with streaming</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-primary" />
                    <span>Message attachments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-primary" />
                    <span>Citations & sources</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Medium feature - Streaming */}
            <Card className="group md:col-span-3 lg:col-span-4 hover:border-primary/30 hover:shadow-xl transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader className="p-6">
                <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 shadow-lg">
                  <Zap className="size-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold mb-2">Real-time Streaming</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Lightning-fast responses with Vercel AI SDK streaming
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Medium feature - TypeScript */}
            <Card className="group md:col-span-3 lg:col-span-4 hover:border-primary/30 hover:shadow-xl transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader className="p-6">
                <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 shadow-lg">
                  <Code2 className="size-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold mb-2">Type-safe</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Full TypeScript with Zod validation and type inference
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Wide feature - Multi-Model */}
            <Card className="group md:col-span-6 lg:col-span-4 hover:border-primary/30 hover:shadow-xl transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader className="p-6">
                <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 shadow-lg">
                  <Cpu className="size-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold mb-2">Multi-Model Support</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Switch between OpenAI, Groq, Anthropic, and AI Gateway with one line of code
                </CardDescription>
              </CardHeader>
            </Card>
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
                Define your tool schema with Zod and implement the handler - that's it.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg">
                  <Link href="/chat">
                    <Code2 className="size-4 mr-2" />
                    Start building
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="https://github.com/thorchh/agent-starter" target="_blank" rel="noopener noreferrer">
                    <svg role="img" viewBox="0 0 24 24" className="size-4 mr-2 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d={siGithub.path} />
                    </svg>
                    View on GitHub
                  </a>
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden border-2 border-border/50 shadow-xl bg-[#0d1117]">
              <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2 flex items-center gap-2">
                <FileCode className="size-4 text-[#7d8590]" />
                <span className="text-xs font-medium text-[#7d8590]">tools/weather.ts</span>
              </div>
              <CardHeader className="p-6 bg-[#0d1117]">
                <pre className="text-sm overflow-x-auto font-mono leading-relaxed [&_*::selection]:bg-[#388bfd] [&_*::selection]:text-white">
                  <code className="text-[#c9d1d9] select-text">
                    <span className="text-[#ff7b72]">export</span> <span className="text-[#ff7b72]">const</span> <span className="text-[#d2a8ff]">weatherTool</span> <span className="text-[#ff7b72]">=</span> {"{"}{"\n"}
                    {"  "}<span className="text-[#79c0ff]">name</span>: <span className="text-[#a5d6ff]">'getWeather'</span>,{"\n"}
                    {"  "}<span className="text-[#79c0ff]">description</span>: <span className="text-[#a5d6ff]">'Get weather for a location'</span>,{"\n"}
                    {"  "}<span className="text-[#79c0ff]">parameters</span>: <span className="text-[#d2a8ff]">z</span>.<span className="text-[#d2a8ff]">object</span>({"{"}{"\n"}
                    {"    "}<span className="text-[#79c0ff]">location</span>: <span className="text-[#d2a8ff]">z</span>.<span className="text-[#d2a8ff]">string</span>(){"\n"}
                    {"      "}.<span className="text-[#d2a8ff]">describe</span>(<span className="text-[#a5d6ff]">'City name'</span>),{"\n"}
                    {"  "}{"}"}{"),,"}{"\n"}
                    {"  "}<span className="text-[#79c0ff]">execute</span>: <span className="text-[#ff7b72]">async</span> ({"{"} <span className="text-[#ffa657]">location</span> {"}"}) <span className="text-[#ff7b72]">=&gt;</span> {"{"}{"\n"}
                    {"    "}<span className="text-[#ff7b72]">const</span> <span className="text-[#79c0ff]">weather</span> <span className="text-[#ff7b72]">=</span> <span className="text-[#ff7b72]">await</span> <span className="text-[#d2a8ff]">fetchWeather</span>(<span className="text-[#ffa657]">location</span>);{"\n"}
                    {"    "}<span className="text-[#ff7b72]">return</span> {"{"}{"\n"}
                    {"      "}<span className="text-[#79c0ff]">temperature</span>: <span className="text-[#ffa657]">weather</span>.<span className="text-[#79c0ff]">temp</span>,{"\n"}
                    {"      "}<span className="text-[#79c0ff]">condition</span>: <span className="text-[#ffa657]">weather</span>.<span className="text-[#79c0ff]">condition</span>,{"\n"}
                    {"    "}{"}"};{"\n"}
                    {"  "}{"}"}{"\n"}
                    {"}"};
                  </code>
                </pre>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="container mx-auto px-4 sm:px-6 py-24 md:py-32 bg-muted/10 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="secondary" className="px-4 py-2 text-xs font-semibold tracking-wide uppercase">
              Tech Stack
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Powered by the best</h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
              Industry-leading technologies, fully integrated
            </p>
          </div>

          {/* Logo Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { name: "Next.js", icon: siNextdotjs, color: "#000000" },
              { name: "React", icon: siReact, color: "#61DAFB" },
              { name: "TypeScript", icon: siTypescript, color: "#3178C6" },
              { name: "Tailwind CSS", icon: siTailwindcss, color: "#06B6D4" },
              { name: "Vercel AI SDK", icon: siVercel, color: "#000000" },
              { name: "shadcn/ui", icon: siShadcnui, color: "#000000" },
              { name: "Zod", icon: siZod, color: "#3E67B1" },
              { name: "OpenAI", icon: openaiIcon, color: "#000000" },
            ].map((tech) => (
              <div
                key={tech.name}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500" />
                <Card className="relative h-full p-6 border border-border/40 bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                  <div className="flex flex-col items-center justify-center space-y-3 h-full min-h-[120px]">
                    {/* Brand logo */}
                    <div className="relative size-14 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                      <svg
                        role="img"
                        viewBox="0 0 24 24"
                        className="w-full h-full"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ fill: tech.color }}
                      >
                        <title>{tech.name}</title>
                        <path d={tech.icon.path} />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground/90 group-hover:text-foreground transition-colors">
                        {tech.name}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              All components integrated and configured. Zero setup required.
            </p>
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
                    href="https://github.com/thorchh/agent-starter"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg role="img" viewBox="0 0 24 24" className="size-5 mr-2 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d={siGithub.path} />
                    </svg>
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
                href="https://github.com/thorchh/agent-starter"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4 flex items-center gap-2 group"
              >
                <svg role="img" viewBox="0 0 24 24" className="size-4 group-hover:scale-110 transition-transform fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d={siGithub.path} />
                </svg>
                GitHub
              </a>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/30 text-center">
            <p className="text-xs text-muted-foreground">
              Made with{" "}
              <span className="text-red-500 animate-pulse inline-block">♥</span>{" "}
              by thorchh
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
