'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Search, 
  Edit, 
  Trash2, 
  FileText, 
  Check, 
  Loader2 ,
  X
} from 'lucide-react';
import { API_ROUTES } from '@/config';

function TopicDatabase() {
  const router = useRouter();
  const [topics, setTopics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await fetch(`${API_ROUTES.QUESTION_SERVICE.GET_TOPICS}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch topics: ${response.statusText}`);
      }
      const responseData = await response.json();
      setTopics(responseData.data || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
      setTopics([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEdit = (topic) => {
    setEditingTopic({
      _id: topic._id,
      topic: topic.data.topic,
      description: topic.data.description,
      difficulty: topic.data.difficulty,
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const { _id, topic, description, difficulty } = editingTopic;
      const data = { _id, topic, description, difficulty };

      const response = await fetch(`${API_ROUTES.QUESTION_SERVICE.UPDATE_TOPIC}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update topic: ${response.statusText}`);
      }

      setEditModalOpen(false);
      setEditingTopic(null);
      await fetchTopics();
    } catch (error) {
      console.error('Error updating topic:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (topicId) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_ROUTES.QUESTION_SERVICE.DELETE_TOPIC}?id=${topicId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete topic: ${response.statusText}`);
      }

      await fetchTopics();
    } catch (error) {
      console.error('Error deleting topic:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewQuestions = (topicId) => {
    router.push(`/funnel-management/dashboard/trainer/question-bank/session-topic/question-generation?topicId=${topicId}`);
  };

  const filteredTopics = (topics || []).filter((topic) =>
    topic.data.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.data.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header and Back Button */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>
        <h1 className="text-2xlfont-bold text-gray-900 dark:text-white">
          Topic Database
        </h1>
        <div className="w-8"></div> {/* Spacer for alignment */}
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search topics..."
          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      )}

      {/* Topics Grid */}
      {!isLoading && filteredTopics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => (
            <div key={topic._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {topic.data.topic}
                </h3>
                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 mb-3">
                  {topic.data.difficulty}
                </span>
                <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                  {topic.data.description}
                </p>
              </div>
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => handleViewQuestions(topic._id)}
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Questions
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(topic)}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(topic._id)}
                      className="p-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Empty State */}
      {!isLoading && filteredTopics.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-600 p-4 rounded">
          <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200">
            No topics found
          </h3>
          <p className="text-blue-700 dark:text-blue-300">
            {searchTerm ? 'Try a different search term' : 'Please add some topics to get started'}
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75" onClick={() => setEditModalOpen(false)}></div>
            </div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Edit Topic
                  </h3>
                  <button
                    onClick={() => setEditModalOpen(false)}
                    className="text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 focus:outline-none"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Topic
                    </label>
                    <input
                      id="edit-topic"
                      type="text"
                      className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white px-4 py-2"
                      value={editingTopic?.topic || ''}
                      onChange={(e) => setEditingTopic({ ...editingTopic, topic: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Difficulty
                    </label>
                    <select
                      id="edit-difficulty"
                      className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white px-4 py-2"
                      value={editingTopic?.difficulty || ''}
                      onChange={(e) => setEditingTopic({ ...editingTopic, difficulty: e.target.value })}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      id="edit-description"
                      rows={3}
                      className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white px-4 py-2"
                      value={editingTopic?.description || ''}
                      onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/30 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className={`px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                    isUpdating ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 inline" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="-ml-1 mr-2 h-4 w-4 inline" />
                      Update
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TopicDatabase;