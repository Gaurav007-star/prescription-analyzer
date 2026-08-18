import { Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

/**
 * Shared top navigation bar used on both the Landing and Analysis pages.
 *
 * Props:
 *  - rightSlot:    optional content for the right side
 *  - stickyHeader: set false to render as a normal block element (default: true)
 */
export function Navbar({
  rightSlot,
  stickyHeader = true,
}: {
  rightSlot?: React.ReactNode;
  stickyHeader?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <header
      className={`${
        stickyHeader ? "sticky top-0 z-30" : "relative z-10"
      } shrink-0 border-b-2 border-foreground bg-card print:hidden`}
    >
      <div className="max-w-screen-2xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
        >
          <div className="bg-primary text-primary-foreground p-2 border-2 border-foreground shadow-[var(--shadow-sm)]">
            <Activity className="w-4 h-4" />
          </div>
          <span className="uppercase">PrescriptionAI</span>
        </button>

        {/* Right slot */}
        <nav className="flex items-center gap-3">
          {rightSlot ?? (
            <Button
              size="sm"
              className="text-sm font-bold uppercase px-5 border-2 border-foreground shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
              onClick={() => navigate("/")}
            >
              Get Started
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
