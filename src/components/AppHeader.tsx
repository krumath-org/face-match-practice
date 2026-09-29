import { AppNav } from "@/components/AppNav";
import { KruMathBar } from "@/components/KruMathBar";

/**
 * Brand bar on top; Practice/Items sit on their own slim row beneath it
 * (above each page's tools), so the brand row stays uncluttered.
 */
export function AppHeader() {
  return (
    <div className="shrink-0">
      <KruMathBar />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-center px-3 py-1.5 sm:px-6 lg:px-5">
        <AppNav />
      </div>
    </div>
  );
}
