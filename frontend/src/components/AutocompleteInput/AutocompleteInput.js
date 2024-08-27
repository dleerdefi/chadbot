import React, { useState, useEffect, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import './AutocompleteInput.css';

const AutocompleteInput = memo(({ value, onChange, onSubmit, users }) => {
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
    } else if (e.key === 'Enter' && suggestions.length === 0) {
      onSubmit(e);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (!suggestion.username) {
      console.error('Suggestion does not have a username:', suggestion);
      return;
    }
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
        aria-autocomplete="list"
        aria-controls="suggestions-list"
        aria-activedescendant={suggestions.length > 0 ? `suggestion-${activeSuggestion}` : undefined}
      />
      {suggestions.length > 0 && (
        <ul id="suggestions-list" className="suggestions-list" role="listbox">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion._id}
              id={`suggestion-${index}`}
              role="option"
              aria-selected={index === activeSuggestion}
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
});

AutocompleteInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  users: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired
  })).isRequired
};

export default AutocompleteInput;