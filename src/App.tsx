import "./App.css";
import Page from "./app/dashboard/page";
import { ThemeProvider } from "./components/themeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Page />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
