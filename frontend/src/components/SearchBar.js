import React from "react";

const SearchBar = React.memo(({ onChange }) => (
	<input
		type="text"
		placeholder="Search users and bots"
		onChange={(e) => onChange(e.target.value)}
		aria-label="Search users and bots"
		className="w-full p-2 bg-input text-textPrimary border border-border rounded-md shadow-sm placeholder:text-textSecondary focus:outline-none transition-colors duration-300"
	/>
));

export default SearchBar;
