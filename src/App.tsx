import "./App.css";
import { HashRouter as Router } from "react-router-dom";
import { ThemeProvider } from "@/components/shared/themeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppRoutes } from "@/routes/AppRoutes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { useDisableContextMenu } from "@/lib/useDisableContextMenu";

import { UpdateModal } from "@/components/ui/update-modal";

function App() {
	useDisableContextMenu();

	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<TooltipProvider>
				<AuthProvider>
					<Router>
						<AppRoutes />
					</Router>
				</AuthProvider>
			</TooltipProvider>
			<Toaster position="top-right" />
			<UpdateModal />
		</ThemeProvider>
	);
}

export default App;
