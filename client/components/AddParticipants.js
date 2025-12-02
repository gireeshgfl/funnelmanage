import React, { useState } from 'react';
import { Card, Input, Button } from '@components/ui/components';
import { Plus, Mail, X } from 'lucide-react';
import { useSessionParticipantOperations } from '@/hooks/useParticipantOperations';

const AddParticipants = ({ onAddParticipants, existingParticipants = [], sessionId }) => {
  const [emailInput, setEmailInput] = useState('');
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState('');

  // Use the participant operations hook - modified to handle multiple emails
  const { handleAddParticipants, loading, feedbackMessage, setFeedbackMessage } = useSessionParticipantOperations(sessionId);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddEmail = () => {
    const email = emailInput.trim();

    if (!email) {
      setError('Please enter an email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if email already exists in current list
    if (participants.includes(email)) {
      setError('This email has already been added');
      return;
    }

    // Check if email exists in existing participants
    if (existingParticipants.includes(email)) {
      setError('This participant is already in the session');
      return;
    }

    setParticipants([...participants, email]);
    setEmailInput('');
    setError('');
  };

  const handleRemoveEmail = (emailToRemove) => {
    setParticipants(participants.filter(email => email !== emailToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleSubmit = async () => {
    if (participants.length === 0) {
      setError('Please add at least one participant');
      return;
    }

    try {
      setFeedbackMessage(''); // Clear any previous messages

      // Add all participants in a single API call
      const success = await handleAddParticipants(participants);

      if (success) {
        // If using the onAddParticipants prop (for parent component handling)
        if (onAddParticipants) {
          onAddParticipants(participants);
        }

        // Clear the form after successful submission
        setParticipants([]);
        setEmailInput('');
        setError('');
      }

    } catch (error) {
      console.error('Error adding participants:', error);
      setError('Failed to add participants. Please try again.');
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 dark:text-white">
        <Mail className="h-5 w-5 text-primary-500" />
        Add Participants
      </h2>

      <div className="space-y-4">
        {/* Feedback Message */}
        {feedbackMessage && (
          <div className={`p-3 rounded-lg text-sm ${feedbackMessage.includes('successfully')
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
            {feedbackMessage}
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              label="Email Address"
              type="email"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setError('');
                setFeedbackMessage(''); // Clear feedback when typing
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter participant's email..."
              error={error}
              disabled={loading}
            />
          </div>
          <div className="self-end">
            <Button
              onClick={handleAddEmail}
              variant="secondary"
              icon={<Plus size={18} />}
              disabled={loading}
            >
              Add
            </Button>
          </div>
        </div>

        {participants.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Participants to be added ({participants.length})
            </h3>
            <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
              {participants.map((email, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-md"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">{email}</span>
                  <Button
                    onClick={() => handleRemoveEmail(email)}
                    variant="ghost"
                    size="sm"
                    icon={<X size={14} />}
                    className="text-red-500 hover:text-red-600"
                    disabled={loading}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          variant="primary"
          className="w-full"
          disabled={participants.length === 0 || loading}
          loading={loading}
        >
          {loading ? 'Adding Participants...' : 'Add Participants to Session'}
        </Button>
      </div>
    </Card>
  );
};

export default AddParticipants;