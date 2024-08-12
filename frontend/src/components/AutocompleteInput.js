import React, { useState, useEffect, useRef } from 'react';
import '../AutocompleteInput.css';

const AutocompleteInput = ({ value, onChange, onSubmit, users }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const lastWord = value.split(' ').pop();
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      const matchingUsers = users.filter(user => 
        user.username.toLowerCase().startsWith(lastWord.slice(1).toLowerCase())
      );
      setSuggestions(matchingUsers);
    } else {
      setSuggestions([]);
    }
  }, [value, users]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      const words = value.split(' ');
      words[words.length - 1] = `@${suggestions[activeSuggestion].username}`;
      onChange(words.join(' '));
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const words = value.split(' ');
    words[words.length - 1] = `@${suggestion.username}`;
    onChange(words.join(' '));
    setSuggestions([]);
    inputRef.current.focus();
  };

  return (
    <div className="autocomplete-container">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
      />
      {suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion._id}
              className={index === activeSuggestion ? 'active' : ''}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              @{suggestion.username}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteInput;