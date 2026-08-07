import FileUpload from './FileUpload'
import { Activity, Sparkles, FileText, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">

      {/* Navbar */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-sm print:hidden">
        <div className="max-w-7xl mx-auto px-5 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 font-semibold text-xl tracking-tight">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <span>PrescriptionAI</span>
          </div>
          <nav className="flex items-center gap-4">
            <Button size="sm" className="text-base font-medium px-6">Get Started</Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero */}
        <section className="py-24 px-4 border-b border-border print:hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_auto] gap-16 items-center">

            {/* Left: Copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-muted text-sm font-medium text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                AI-Powered Medical Document Analysis
              </div>

              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                Understand your<br />
                prescription in <span className="text-primary italic">seconds</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Upload any medical prescription — handwritten or printed — and instantly get a structured breakdown of medicines, dosage, timing, and plain-English explanations.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Button size="lg" className="gap-2 text-base px-6">
                  Analyze a Prescription <Zap className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="lg" className="text-base px-6">
                  See how it works
                </Button>
              </div>

              {/* Trust Strip */}
              <div className="flex flex-wrap gap-6 pt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-foreground" /><strong className="text-foreground">Private.</strong> Files are never stored.</span>
                <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-foreground" /><strong className="text-foreground">PDF & Image</strong> supported.</span>
                <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-foreground" /><strong className="text-foreground">AI insights</strong> in plain language.</span>
              </div>
            </div>

            {/* Right: Visual Mock */}
            <div className="hidden lg:block w-80 shrink-0">
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                {/* Mock toolbar */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-muted/50">
                  <span className="w-2.5 h-2.5 rounded-full bg-border"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-border"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-border"></span>
                  <span className="ml-auto text-xs text-muted-foreground font-mono">prescription.pdf</span>
                </div>
                {/* Mock prescription card */}
                <div className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <div className="h-4 bg-foreground/10 rounded w-2/3"></div>
                    <div className="h-2.5 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="h-px bg-border"></div>
                  {/* Mock medicine rows */}
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-foreground/30 mt-1.5 shrink-0"></div>
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-foreground/15 rounded w-3/4"></div>
                        <div className="h-2.5 bg-muted rounded w-1/2"></div>
                      </div>
                      <div className="h-6 w-14 rounded-full bg-muted border border-border text-[10px] text-muted-foreground flex items-center justify-center shrink-0">
                        {i === 1 ? "5 days" : i === 2 ? "3 days" : "7 days"}
                      </div>
                    </div>
                  ))}
                  <div className="h-px bg-border"></div>
                  <div className="flex gap-2 pt-2">
                    <div className="h-6 w-16 rounded-full bg-muted border border-border"></div>
                    <div className="h-6 w-20 rounded-full bg-muted border border-border"></div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">Structured output, every time.</p>
            </div>

          </div>
        </section>

        {/* Upload + Result */}
        <section className="py-12 px-4 bg-muted/30 print:p-0 print:bg-transparent">
          <div className="max-w-7xl mx-auto print:max-w-none">
            <FileUpload />
          </div>
        </section>

        {/* Feature Pills */}
        <section className="py-16 px-4 border-t border-border print:hidden">
          <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: <FileText className="w-6 h-6" />,
                title: "Smart Extraction",
                desc: "AI reads both printed and handwritten prescriptions with high accuracy.",
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: "Patient Insights",
                desc: "Get simple explanations of medicines, advice, and what to watch out for.",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Structured Output",
                desc: "Neatly organized medication table with dosage, timing, and duration.",
              },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-xl border border-border bg-card space-y-3">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-5 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} PrescriptionAI. All rights reserved.</span>
          <span>For educational use only. Always consult your doctor.</span>
        </div>
      </footer>
    </div>
  )
}

export default App
