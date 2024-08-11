import React, { useState } from 'react';
import axios from 'axios';

const MessageInput = ({ onSendMessage }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        try {
            const response = await axios.post('http://localhost:3000/api/messages', { message });
            onSendMessage(response.data); // Ensure this sends the response data back to the parent component
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message"
            />
            <button type="submit">Send</button>
        </form>
    );
};

export default MessageInput;
