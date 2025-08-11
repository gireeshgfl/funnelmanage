'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, BookOpen, Users, Info, X, Check, ChevronsUpDown, Search } from 'lucide-react';
import { Input, Dropdown, Button, DropdownItem } from '@components/ui/components';

const SessionFormModal = ({ open, onClose, onSubmit, initialData, availableTopics = [], availableParticipants = [], fetchFunnellingData }) => {
  const [sessionName, setSessionName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [topic, setTopic] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Funnel Participants state
  const [funnelCount, setFunnelCount] = useState(1);
  const [isFetchingFunnel, setIsFetchingFunnel] = useState(false);
  const [funnelParticipants, setFunnelParticipants] = useState([]);
  const [selectedFunnelParticipants, setSelectedFunnelParticipants] = useState([]);
  const [funnelSelectionMode, setFunnelSelectionMode] = useState('all');
  const [hasFetchedParticipants, setHasFetchedParticipants] = useState(false);

  // Discount state
  const [discount, setDiscount] = useState('');
  const [discountError, setDiscountError] = useState('');

  // Debug useEffect
  useEffect(() => {
    console.log('Funnel Participants:', funnelParticipants);
    console.log('Selected Funnel Participants:', selectedFunnelParticipants);
  }, [funnelParticipants, selectedFunnelParticipants]);

  const topicOptions = useMemo(() => 
    availableTopics.map(topic => ({
      value: topic.id || topic.value,
      label: `${topic.text || topic.name}${topic.difficulty ? ` (${topic.difficulty})` : ''}`
    })),
    [availableTopics]
  );

  const participantOptions = useMemo(() =>
    availableParticipants.map(participant => ({
      value: participant.id || participant.value,
      label: participant.text || participant.name
    })),
    [availableParticipants]
  );

  useEffect(() => {
    if (initialData) {
      setSessionName(initialData.sessionName || '');
      setDate(initialData.date || '');
      setTime(initialData.time || '');
      setTopic(initialData.topic || '');
      setAdditionalInfo(initialData.additionalInfo || '');
      setSelectedTopics(initialData.questions ? initialData.questions.map(q => q.id) : []);
      setSelectedParticipants(initialData.participants ? initialData.participants.map(p => p.id) : []);
      setSelectedFunnelParticipants(initialData.funnelParticipants || []);
      setFunnelParticipants(initialData.funnelParticipantsData || []);
      setHasFetchedParticipants(!!initialData.funnelParticipantsData);
      setDiscount(initialData.discount || '');
    } else {
      resetForm();
    }
  }, [initialData, open]);

  const resetForm = () => {
    setSessionName('');
    setDate('');
    setTime('');
    setTopic('');
    setAdditionalInfo('');
    setSelectedTopics([]);
    setSelectedParticipants([]);
    setSelectedFunnelParticipants([]);
    setFunnelCount(1);
    setFunnelParticipants([]);
    setFunnelSelectionMode('all');
    setHasFetchedParticipants(false);
    setDiscount('');
    setDiscountError('');
    setFormError('');
  };

  const hasChanges = useMemo(() => {
    if (!initialData) return true;
    return (
      sessionName !== (initialData.sessionName || '') ||
      date !== (initialData.date || '') ||
      time !== (initialData.time || '') ||
      topic !== (initialData.topic || '') ||
      additionalInfo !== (initialData.additionalInfo || '') ||
      discount !== (initialData.discount || '') ||
      JSON.stringify(selectedTopics.sort()) !== JSON.stringify((initialData.questions ? initialData.questions.map(q => q.id) : []).sort()) ||
      JSON.stringify(selectedParticipants.sort()) !== JSON.stringify((initialData.participants ? initialData.participants.map(p => p.id) : []).sort()) ||
      JSON.stringify(selectedFunnelParticipants.sort()) !== JSON.stringify((initialData.funnelParticipants || []).sort())
    );
  }, [sessionName, date, time, topic, additionalInfo, discount, selectedTopics, selectedParticipants, selectedFunnelParticipants, initialData]);

  const handleDiscountChange = (e) => {
    const value = e.target.value;
    // Allow empty string or valid numbers between 0-100
    if (value === '' || (!isNaN(value) && value >= 0 && value <= 100)) {
      setDiscount(value);
      setDiscountError('');
    } else {
      setDiscount(value);
      setDiscountError('Please enter a valid percentage (0-100)');
    }
  };

  const handleSubmit = async () => {
    // Validate discount first
    if (discount && (isNaN(discount) || discount < 0 || discount > 100)) {
      setFormError('Please enter a valid discount percentage (0-100)');
      return;
    }

    if (!sessionName || !date || !time || selectedTopics.length === 0) {
      setFormError('Please fill in all required fields and select at least one topic.');
      return;
    }
    if (!hasChanges) return;
    
    setFormError('');
    setIsSubmitting(true);
    
    const questionsPayload = selectedTopics.map((id) => {
      const found = availableTopics.find((q) => (q.id || q.value) === id);
      return found ? { 
        id, 
        name: found.text || found.name, 
        difficulty: found.difficulty || "Easy" 
      } : { id, name: "", difficulty: "Easy" };
    });
  
    const participantsPayload = selectedParticipants.map((id) => {
      const found = availableParticipants.find((p) => (p.id || p.value) === id);
      return found ? { 
        id, 
        name: found.text || found.name 
      } : { id, name: "" };
    });

    const funnelParticipantsPayload = selectedFunnelParticipants.map((id) => {
      const found = funnelParticipants.find((p) => p.value === id);
      return found || { id, name: "" };
    });
  
    const sessionData = { 
      sessionName, 
      date, 
      time, 
      topic, 
      additionalInfo,
      discount: discount || 0, // Include discount (default to 0 if empty)
      questions: questionsPayload,
      participants: participantsPayload,
      funnelParticipants: funnelParticipantsPayload,
      funnelParticipantsData: funnelParticipants
    };
  
    try {
      await onSubmit(sessionData);
      onClose();
      resetForm();
    } catch (error) {
      setFormError(error.message || 'An error occurred while saving the session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTopicSelect = (topicId) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleParticipantSelect = (participantId) => {
    setSelectedParticipants(prev => 
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const fetchFunnelParticipants = async () => {
    if (!funnelCount || funnelCount < 1) {
      setFormError('Please enter a valid number (1 or above)');
      return;
    }
    
    if (discountError) {
      setFormError('Please fix discount errors before fetching participants');
      return;
    }
    
    setIsFetchingFunnel(true);
    setHasFetchedParticipants(false);
    try {
      const response = await fetchFunnellingData(funnelCount);
      console.log('API Response:', response);
      
      if (response?.status === 200 && Array.isArray(response.data)) {
        const formattedData = response.data.map(participant => ({
          value: participant.userId,
          label: participant.username || `Participant ${participant.userId}`,
          sessionCount: participant.session_count,
          sessions: participant.sessions
        }));
        
        console.log('Formatted Data:', formattedData);
        setFunnelParticipants(formattedData);
        setHasFetchedParticipants(true);
        setFormError('');
      } else {
        const errorMsg = response?.message || 'Failed to fetch funnel participants';
        console.error('API Error:', errorMsg);
        setFormError(errorMsg);
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      setFormError(error.message || 'Failed to fetch funnel participants');
    } finally {
      setIsFetchingFunnel(false);
    }
  };

  const handleFunnelParticipantSelect = (participantId) => {
    if (funnelSelectionMode === 'all') {
      setSelectedFunnelParticipants(funnelParticipants.map(p => p.value));
    } else {
      setSelectedFunnelParticipants(prev => 
        prev.includes(participantId)
          ? prev.filter(id => id !== participantId)
          : [...prev, participantId]
      );
    }
  };

  const handleFunnelCountChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setFunnelCount(value);
    } else {
      setFunnelCount('');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {initialData ? 'Edit Session' : 'Create New Session'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {formError && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 p-4 mx-4 mt-2 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {formError}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              <Input
                label="Session Name"
                id="sessionName"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                required
                className="w-full"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Schedule Date"
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  icon={<Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
                  className="w-full"
                />
                <Input
                  label="Time"
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  icon={<Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
                  className="w-full"
                />
              </div>

              <Input
                label="Topic"
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full"
              />

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Questions
        </label>
        {topicOptions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No topics available. Please add topics.
          </p>
        ) : (
          <Dropdown
            trigger={
              <button className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-left flex justify-between items-center bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                {selectedTopics.length > 0 
                  ? `${selectedTopics.length} selected` 
                  : 'Select questions'}
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            }
            position="bottom"
            className="w-full"
          >
            <div className="max-h-60 overflow-y-auto">
              {topicOptions.map(option => (
                <DropdownItem 
                  key={option.value}
                  onClick={() => handleTopicSelect(option.value)}
                  className={`flex items-center ${selectedTopics.includes(option.value) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTopics.includes(option.value)}
                    readOnly
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  {option.label}
                </DropdownItem>
              ))}
            </div>
          </Dropdown>
        )}
        {selectedTopics.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedTopics.map(topicId => {
              const topic = availableTopics.find(t => (t.id || t.value) === topicId);
              return (
                <span 
                  key={topicId} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200"
                >
                  {topic?.text || topic?.name || topicId}
                  {topic?.difficulty && ` (${topic.difficulty})`}
                  <button 
                    onClick={() => handleTopicSelect(topicId)}
                    className="ml-1.5 inline-flex text-primary-400 hover:text-primary-600 dark:hover:text-primary-300"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Participants
                </label>
                <Dropdown
                  trigger={
                    <button className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-left flex justify-between items-center bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      {selectedParticipants.length > 0 
                        ? `${selectedParticipants.length} selected` 
                        : 'Select participants'}
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  }
                  position="bottom"
                  className="w-full"
                >
                  <div className="max-h-60 overflow-y-auto">
                    {participantOptions.map(option => (
                      <DropdownItem 
                        key={option.value}
                        onClick={() => handleParticipantSelect(option.value)}
                        className={`flex items-center ${selectedParticipants.includes(option.value) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedParticipants.includes(option.value)}
                          readOnly
                          className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        {option.label}
                      </DropdownItem>
                    ))}
                  </div>
                </Dropdown>
                {selectedParticipants.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedParticipants.map(participantId => {
                      const participant = availableParticipants.find(p => (p.id || p.value) === participantId);
                      return (
                        <span 
                          key={participantId} 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        >
                          {participant?.text || participant?.name || participantId}
                          <button 
                            onClick={() => handleParticipantSelect(participantId)}
                            className="ml-1.5 inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Funnel Participants with Discount Section */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Funnel Participants & Discount
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                  <div>
                    <Input
                      type="number"
                      min="1"
                      value={funnelCount}
                      onChange={handleFunnelCountChange}
                      className="w-full"
                      placeholder="Enter participant count"
                    />
                  </div>
                  <div>
                    <Input
                      label="Discount (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={discount}
                      onChange={handleDiscountChange}
                      className="w-full"
                      placeholder="0-100"
                      error={discountError}
                    />
                  </div>
                </div>

                <div className="mb-2">
                  <Button
                    onClick={fetchFunnelParticipants}
                    variant="outline"
                    loading={isFetchingFunnel}
                    className="flex items-center"
                    disabled={!!discountError}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Fetch Participants
                  </Button>
                  {discountError && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{discountError}</p>
                  )}
                </div>

                {isFetchingFunnel && (
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Fetching participants...
                  </div>
                )}

                <div className="flex gap-4 mb-2">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-primary-600 dark:text-primary-400"
                      checked={funnelSelectionMode === 'all'}
                      onChange={() => setFunnelSelectionMode('all')}
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Select All</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-primary-600 dark:text-primary-400"
                      checked={funnelSelectionMode === 'single'}
                      onChange={() => setFunnelSelectionMode('single')}
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Select Individually</span>
                  </label>
                </div>

                {funnelParticipants.length > 0 && (
                  <>
                    <Dropdown
                      trigger={
                        <button className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-left flex justify-between items-center bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                          {selectedFunnelParticipants.length > 0 
                            ? `${selectedFunnelParticipants.length} selected` 
                            : 'Select funnel participants'}
                          <ChevronsUpDown className="h-5 w-5 text-gray-400" />
                        </button>
                      }
                      position="bottom"
                      className="w-full z-50"
                    >
                      <div className="max-h-60 overflow-y-auto">
                        {funnelParticipants.map(participant => (
                          <DropdownItem 
                            key={participant.value}
                            onClick={() => handleFunnelParticipantSelect(participant.value)}
                            className={`flex items-center ${selectedFunnelParticipants.includes(participant.value) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                          >
                            {funnelSelectionMode === 'single' && (
                              <input
                                type="checkbox"
                                checked={selectedFunnelParticipants.includes(participant.value)}
                                readOnly
                                className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium">{participant.label}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Attended {participant.sessionCount} session(s)
                              </p>
                            </div>
                          </DropdownItem>
                        ))}
                      </div>
                    </Dropdown>

                    {selectedFunnelParticipants.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedFunnelParticipants.map(participantId => {
                          const participant = funnelParticipants.find(p => p.value === participantId);
                          return (
                            <span 
                              key={participantId} 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200"
                            >
                              {participant?.label || participantId}
                              <button 
                                onClick={() => handleFunnelParticipantSelect(participantId)}
                                className="ml-1.5 inline-flex text-purple-400 hover:text-purple-600 dark:hover:text-purple-300"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              <Input
                label="Additional Info"
                id="additionalInfo"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                type="textarea"
                rows={3}
                icon={<Info className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
                className="w-full"
              />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleSubmit}
              variant="primary"
              disabled={isSubmitting || (initialData && !hasChanges)}
              className="sm:ml-3 sm:w-auto"
              loading={isSubmitting}
            >
              <Check className="-ml-1 mr-2 h-5 w-5" />
              {initialData ? 'Update Session' : 'Create Session'}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="mt-3 sm:mt-0 sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionFormModal;