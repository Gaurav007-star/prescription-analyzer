import FileUpload from './FileUpload'
import { Activity, LayoutDashboard, Sparkles, FileText, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Navbar */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <Activity className="w-5 h-5" />
            </div>
            <span>PrescriptionAnalyzer</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Features</a>
            <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
            <a href="#" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="hidden sm:flex">Log in</Button>
            <Button>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 md:py-32 px-4 text-center relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10"></div>
          
          <div className="container mx-auto max-w-4xl space-y-8 relative z-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm font-medium text-muted-foreground mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>AI-Powered Image Parsing</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-balance leading-tight">
              Transform Prescriptions into <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Structured Data</span>
            </h1>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Upload images of medical prescriptions and let our advanced AI instantly convert them into clean, structured markdown format.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button size="lg" className="rounded-full gap-2">
                Start Parsing <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full gap-2">
                <LayoutDashboard className="w-4 h-4" /> View Dashboard
              </Button>
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <section className="py-16 px-4 bg-muted/30 border-y">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Try it out below</h2>
              <p className="text-muted-foreground">Secure, fast, and highly accurate medical text extraction.</p>
            </div>
            
            <FileUpload />
            
          </div>
        </section>
        
        {/* Features / Info */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">High Accuracy</h3>
                <p className="text-muted-foreground">State of the art OCR and AI models ensure your data is extracted with pinpoint precision.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Markdown Output</h3>
                <p className="text-muted-foreground">Get clean, formatted markdown that is ready to be used in your applications or exported to PDF.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Fast Processing</h3>
                <p className="text-muted-foreground">Optimized backend processes your uploads in seconds, keeping your workflow uninterrupted.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} PrescriptionAnalyzer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
