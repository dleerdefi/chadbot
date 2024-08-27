import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";
import "./index.css";
import { ChatProvider } from "./contexts/ChatContext";

const root = createRoot(document.getElementById("root"));
root.render(
	<AppProvider>
		<AuthProvider>
			<WebSocketProvider>
				<ChatProvider>
					<App />
				</ChatProvider>
			</WebSocketProvider>
		</AuthProvider>
	</AppProvider>
);
