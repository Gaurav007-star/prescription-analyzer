import FileUpload from "./FileUpload";
import { Activity, Sparkles, FileText, Shield, Zap, TrendingUp, Users, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-20 border-b-2 border-foreground bg-card print:hidden">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-lg tracking-tight">
            <div className="bg-primary text-primary-foreground p-2 border-2 border-foreground shadow-[var(--shadow-sm)]">
              <Activity className="w-4 h-4" />
            </div>
            <span className="uppercase">PrescriptionAI</span>
          </div>
          <nav className="flex items-center gap-4">
            <Button size="sm" className="text-sm font-bold uppercase px-5 border-2 border-foreground shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
              Get Started
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden print:hidden">
          <div className="mx-auto max-w-7xl px-5 pb-20 pt-20 text-center">
            {/* Announcement pill */}
            <div className="inline-flex items-center gap-2 border-2 border-foreground bg-secondary px-4 py-1.5 text-sm font-bold uppercase tracking-wide shadow-[var(--shadow-sm)]">
              <Sparkles className="h-4 w-4 text-primary" />
              AI-Powered Medical Document Analysis
            </div>

            {/* Headline */}
            <h1 className="mx-auto mt-8 max-w-4xl font-serif text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Understand your prescription in Seconds
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed opacity-70">
              Upload any medical prescription — handwritten or printed — and
              instantly get a structured breakdown of medicines, dosage, timing,
              and plain-English explanations.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="gap-2 px-7 text-base font-bold uppercase border-2 border-foreground shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
              >
                Analyze a Prescription <Zap className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="px-7 text-base font-bold uppercase bg-secondary border-2 border-foreground shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                See how it works
              </Button>
            </div>

            {/* Trust strip */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-sm font-medium">
              <span className="flex items-center gap-2 border-2 border-foreground bg-secondary px-3 py-1.5 shadow-[var(--shadow-sm)]">
                <Shield className="h-4 w-4" />
                <strong>Private.</strong> Files are never stored.
              </span>
              <span className="flex items-center gap-2 border-2 border-foreground bg-card px-3 py-1.5 shadow-[var(--shadow-sm)]">
                <FileText className="h-4 w-4" />
                <strong>PDF & Image</strong> supported.
              </span>
              <span className="flex items-center gap-2 border-2 border-foreground bg-secondary px-3 py-1.5 shadow-[var(--shadow-sm)]">
                <Sparkles className="h-4 w-4" />
                <strong>AI insights</strong> in plain language.
              </span>
            </div>

            {/* Product preview */}
            <div className="relative mx-auto mt-14 max-w-5xl text-left">
              <div className="border-2 border-foreground bg-card shadow-[var(--shadow-lg)] overflow-hidden">
                {/* Browser toolbar */}
                <div className="flex items-center gap-2 border-b-2 border-foreground bg-muted px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 bg-secondary border border-foreground"></span>
                    <span className="h-2.5 w-2.5 bg-secondary border border-foreground"></span>
                    <span className="h-2.5 w-2.5 bg-secondary border border-foreground"></span>
                  </div>
                  <div className="mx-auto flex min-w-0 items-center gap-2 border-2 border-foreground bg-card px-3 py-1 text-xs font-mono font-bold">
                    <span className="h-2 w-2 shrink-0 bg-primary"></span>
                    <span className="truncate">
                      prescriptionai.app/analyze
                    </span>
                  </div>
                </div>

                {/* Mock dashboard */}
                <div className="grid gap-3 bg-card p-5 sm:grid-cols-2">
                  {[
                    { name: "Amoxicillin", strength: "500mg", form: "Capsule", timing: "After food", days: "5 days", doses: ["AM 1", "Night 1"] },
                    { name: "Paracetamol", strength: "650mg", form: "Tablet", timing: "After food", days: "3 days", doses: ["AM 1", "PM 1", "Night 1"] },
                    { name: "Azithromycin", strength: "250mg", form: "Tablet", timing: "Empty stomach", days: "3 days", doses: ["AM 1"] },
                    { name: "Cetirizine", strength: "10mg", form: "Tablet", timing: "At night", days: "7 days", doses: ["Night 1"] },
                  ].map((m, i) => (
                    <div
                      key={i}
                      className={`border-2 border-foreground p-4 shadow-[var(--shadow-sm)] ${i % 2 === 0 ? 'bg-card' : 'bg-secondary/50'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold">
                            {m.name}
                            <span className="ml-1 font-normal opacity-70">
                              {m.strength}
                            </span>
                          </p>
                          <p className="mt-1 text-xs opacity-60">
                            {m.form} · {m.timing}
                          </p>
                        </div>
                        <Badge className="shrink-0 px-2 py-0.5 text-[10px] font-bold border-2 border-foreground">
                          {m.days}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {m.doses.map((d, j) => (
                          <span
                            key={j}
                            className="border-2 border-foreground bg-muted px-2 py-0.5 text-[10px] font-bold"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI insight bar */}
                <div className="flex items-center gap-3 border-t-2 border-foreground bg-secondary/60 px-5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary text-primary-foreground border-2 border-foreground shadow-[var(--shadow-sm)]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-snug font-medium">
                    <strong className="font-bold">
                      Patient Guide ready:
                    </strong>{" "}
                    4 medicines verified — prices, manufacturers & pharmacy
                    links included.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Upload + Result */}
        <section className="py-10 px-4 border-t-2 border-foreground bg-secondary/40 print:p-0 print:bg-transparent">
          <div className="max-w-7xl mx-auto print:max-w-none">
            <FileUpload />
          </div>
        </section>

        {/* Stats */}
        <section className="py-14 px-4 border-t-2 border-foreground bg-primary/5 print:hidden">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold uppercase tracking-tight">Trusted by thousands</h2>
              <p className="text-sm opacity-60 mt-1">Real numbers, real impact</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: <FileText className="w-5 h-5" />, value: "12,400+", label: "Prescriptions Analyzed", color: "bg-primary text-primary-foreground" },
                { icon: <CheckCircle className="w-5 h-5" />, value: "98.5%", label: "Accuracy Rate", color: "bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100" },
                { icon: <Clock className="w-5 h-5" />, value: "<10s", label: "Average Analysis Time", color: "bg-secondary text-secondary-foreground" },
                { icon: <Users className="w-5 h-5" />, value: "5,200+", label: "Happy Users", color: "bg-accent text-accent-foreground" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="border-2 border-foreground bg-card p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all text-center group"
                >
                  <div className={`inline-flex p-2.5 border-2 border-foreground shadow-[var(--shadow-sm)] mb-3 ${stat.color} group-hover:scale-110 transition-transform`}>
                    {stat.icon}
                  </div>
                  <p className="text-2xl lg:text-3xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-foreground py-4 bg-secondary/30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-medium opacity-60">
          <span>
            © {new Date().getFullYear()} PrescriptionAI. All rights reserved.
          </span>
          <span>For educational use only. Always consult your doctor.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
