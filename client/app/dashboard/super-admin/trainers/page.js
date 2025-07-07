"use client";
import { useState, useEffect } from "react";
import { API_ROUTES } from '@/config';

export default function Home() {
  const [trainers, setTrainers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ROUTES.SUPER_ADMIN_SERVICE.GET_TRAINERS, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Error fetching trainers: ${response.statusText}`);
      }
      const data = await response.json();
      setTrainers(data.data);
    } catch (error) {
      console.error("Error fetching trainers:", error);
      setError("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (trainerId) => {
    try {
      console.log(`Deleting trainer with ID: ${trainerId}`);
      const response = await fetch(API_ROUTES.SUPER_ADMIN_SERVICE.DELETE_TRAINER, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ _id: trainerId }),
      });
  
      if (!response.ok) {
        throw new Error(`Error deleting trainer: ${response.statusText}`);
      }
  
      await fetchTrainers();
    } catch (error) {
      console.error('Error deleting trainer:', error);
      setError('An error occurred. Please try again later.');
    }
  };
  
  const handleToggleStatus = async (trainerId, currentStatus) => {
    try {
      console.log(`${currentStatus === 'Active' ? 'Deactivating' : 'Activating'} trainer with ID: ${trainerId}`);
  
      const updatedTrainer = {
        _id: trainerId,
        status: currentStatus === 'Active' ? 'Deactivated' : 'Active',
      };
  
      const response = await fetch(API_ROUTES.SUPER_ADMIN_SERVICE.TRAINER_STATUS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTrainer),
      });
  
      if (!response.ok) {
        throw new Error(`${currentStatus === 'Active' ? 'Error deactivating' : 'Error activating'} trainer: ${response.statusText}`);
      }
  
      const result = await response.json();
      console.log(result.message);
  
      setTrainers((prevTrainers) =>
        prevTrainers.map((trainer) =>
          trainer._id === trainerId ? { ...trainer, status: updatedTrainer.status } : trainer
        )
      );
    } catch (error) {
      console.error(`${currentStatus === 'Active' ? 'Error deactivating' : 'Error activating'} trainer:`, error);
      setError(`An error occurred while ${currentStatus === 'Active' ? 'deactivating' : 'activating'} the trainer.`);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <h3 className="font-bold">Error</h3>
            <p>{error}</p>
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
            <h3 className="text-lg font-medium">Loading trainers...</h3>
          </div>
        ) : trainers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {trainers.map((trainer) => (
                  <tr key={trainer._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trainer.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trainer._id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDelete(trainer._id)}
                          className="p-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(trainer._id, trainer.status)}
                          className={`px-3 py-2 rounded text-white focus:outline-none focus:ring-2 ${
                            trainer.status === 'Active' 
                              ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500' 
                              : 'bg-green-500 hover:bg-green-600 focus:ring-green-500'
                          }`}
                        >
                          {trainer.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded">
            <h3 className="font-bold">No trainers found</h3>
          </div>
        )}
      </div>
    </div>
  );
}