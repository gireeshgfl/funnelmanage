"use client";
import React, { useState, useEffect } from 'react';

const PointsData = () => {
    const [pointsData, setPointsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPoints();
    }, []);

    const fetchPoints = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/trainer_dashboard/get_student_points');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            console.log('API Response:', result);
            if (result.points.status === 'success' && Array.isArray(result.points.data)) {
                setPointsData(result.points.data);
            } else {
                setError('Unexpected data format received');
            }
        } catch (e) {
            setError('Failed to fetch points');
            console.error('There was a problem with the fetch operation: ' + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-lg">Loading points...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Student Points Data</h1>
            <button 
                onClick={fetchPoints} 
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded mb-6"
            >
                Refresh Points
            </button>
            
            <div className="overflow-x-auto shadow-md rounded-lg">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">User Name</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {pointsData.length > 0 ? (
                            pointsData.map((student, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">{student.userName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">{student.totalPoints}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="2" className="px-6 py-4 text-center text-gray-500">No Points Data Available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PointsData;