import React from "react";

const SearchBar = React.memo(({ onChange }) => (
	<input
		type="text"
		placeholder="Search users and bots"
		onChange={(e) => onChange(e.target.value)}
		className="search-bar"
		aria-label="Search users and bots"
	/>
));

export default SearchBar;
