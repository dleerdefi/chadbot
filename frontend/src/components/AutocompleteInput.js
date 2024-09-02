import React, { useState, useEffect, useRef, memo } from "react";
import PropTypes from "prop-types";

const AutocompleteInput = memo(({ value, onChange, onSubmit, users }) => {
	const [suggestions, setSuggestions] = useState([]);
	const [activeSuggestion, setActiveSuggestion] = useState(0);
	const inputRef = useRef(null);

	useEffect(() => {
		const lastWord = value.split(" ").pop();
		if (lastWord.startsWith("@") && lastWord.length > 1) {
			const matchingUsers = users.filter((user) =>
				user.username.toLowerCase().startsWith(lastWord.slice(1).toLowerCase())
			);
			setSuggestions(matchingUsers);
		} else {
			setSuggestions([]);
		}
	}, [value, users]);

	const handleKeyDown = (e) => {
		if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveSuggestion((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
		} else if (e.key === "Enter" && suggestions.length > 0) {
			e.preventDefault();
			const words = value.split(" ");
			words[words.length - 1] = `@${suggestions[activeSuggestion].username}`;
			onChange(words.join(" "));
			setSuggestions([]);
		} else if (e.key === "Enter" && suggestions.length === 0) {
			onSubmit(e);
		}
	};

	const handleSuggestionClick = (suggestion) => {
		if (!suggestion.username) {
			console.error("Suggestion does not have a username:", suggestion);
			return;
		}
		const words = value.split(" ");
		words[words.length - 1] = `@${suggestion.username}`;
		onChange(words.join(" "));
		setSuggestions([]);
		inputRef.current.focus();
	};

	return (
		<div className="relative w-full">
			<input
				ref={inputRef}
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder="Type a message..."
				aria-autocomplete="list"
				aria-controls="suggestions-list"
				aria-activedescendant={
					suggestions.length > 0 ? `suggestion-${activeSuggestion}` : undefined
				}
				className="w-full text-primary p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500 transition duration-200"
			/>
			{suggestions.length > 0 && (
				<ul
					id="suggestions-list"
					className="absolute left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto z-10"
					role="listbox"
				>
					{suggestions.map((suggestion, index) => (
						<li
							key={suggestion._id}
							id={`suggestion-${index}`}
							role="option"
							aria-selected={index === activeSuggestion}
							className={`px-3 py-2 cursor-pointer ${
								index === activeSuggestion
									? "bg-blue-500 text-white"
									: "bg-white text-gray-900"
							}`}
							onClick={() => handleSuggestionClick(suggestion)}
						>
							@{suggestion.username}
						</li>
					))}
				</ul>
			)}
		</div>
	);
});

export default AutocompleteInput;
