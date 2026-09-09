import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Brain, Sparkles, CheckCircle, TrendingUp, CalendarDays, ShieldCheck } from "lucide-react";

export default async function LandingPage() {
  const session = await auth();
  
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
              <Brain className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">Tanmay OS</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="text-sm font-bold bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90 transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-95">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-32 pb-20 relative overflow-hidden">
        
        {/* Abstract Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 mix-blend-screen pointer-events-none -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-3xl opacity-50 mix-blend-screen pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Ultimate Personal OS</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight max-w-4xl leading-[1.1] mb-6 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-muted-foreground">
          Your life, perfectly <br className="hidden sm:block" /> orchestrated.
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-medium mb-10 leading-relaxed">
          Manage your tasks, optimize your daily routines with AI, track your career growth, and secure your finances—all in one beautiful dashboard.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/register" className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-extrabold text-lg flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1 active:translate-y-0">
            Start Your Journey
            <TrendingUp className="w-5 h-5" />
          </Link>
          <Link href="/login" className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-card border-2 border-border text-foreground font-extrabold text-lg flex items-center justify-center gap-2 hover:bg-muted/50 transition-all">
            Login to Dashboard
          </Link>
        </div>
      </main>

      {/* Features Grid */}
      <section className="bg-muted/30 border-t border-border/50 py-24 px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Everything you need to level up.</h2>
            <p className="text-muted-foreground font-medium max-w-xl mx-auto">Built from the ground up to be the only tool you need to manage your personal growth.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card border-2 border-border/60 p-8 rounded-3xl hover:border-primary/50 transition-colors shadow-sm hover:shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Tasks</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Organize your workflow with due dates, priorities, and instant sync. Never drop the ball again.</p>
            </div>
            
            <div className="bg-card border-2 border-border/60 p-8 rounded-3xl hover:border-primary/50 transition-colors shadow-sm hover:shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground rounded-full">Powered by Gemini</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Routines</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Describe your day in plain English and watch our AI instantly block out your perfect schedule.</p>
            </div>
            
            <div className="bg-card border-2 border-border/60 p-8 rounded-3xl hover:border-primary/50 transition-colors shadow-sm hover:shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure & Private</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Protected by PIN locks and modern encryption. Your personal API keys and data stay safe.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-border py-8 text-center bg-background">
        <p className="text-xs font-bold text-muted-foreground tracking-wider uppercase">
          &copy; {new Date().getFullYear()} Tanmay OS. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
