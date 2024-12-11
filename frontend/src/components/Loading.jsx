import React from "react";
import { Loader2 } from "lucide-react";

const Loading = () => {
	return (
		<div className="fixed inset-0 z-50 bg-blue-950/50 backdrop-blur-sm flex justify-center items-center">
			<div className="flex flex-col items-center space-y-4">
				<Loader2 className="h-12 w-12 text-blue-300 animate-spin" strokeWidth={1} />
				<p className="text-xl text-blue-100 font-medium tracking-wide">Loading...</p>
			</div>
		</div>
	);
};

export default Loading;
