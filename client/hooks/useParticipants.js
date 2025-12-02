import { useState, useEffect } from 'react';

export const useParticipants = (currentSessionId, socket) => {
    const [participants, setParticipants] = useState([]);

    useEffect(() => {
        if (!socket || !currentSessionId) return;

        console.log("🧠 useParticipants: Binding socket listeners...");

        const handleInitialParticipants = (participantsList) => {
            console.log("🚀 useParticipants: initialParticipants", participantsList);
            setParticipants(participantsList.filter(p => String(p.sessionId) === String(currentSessionId)));
        };

        const handleUserJoined = (userDetails) => {
            console.log("👤 useParticipants: userJoined", userDetails);
            if (String(userDetails.sessionId) === String(currentSessionId)) {
                setParticipants(prev => {
                    const alreadyExists = prev.some(p => p.userId === userDetails.userId);
                    if (alreadyExists) return prev;
                    return [...prev, userDetails];
                });
            }
        };

        const handleUserLeft = ({ userId, sessionId }) => {
            if (String(sessionId) === String(currentSessionId)) {
                setParticipants(prev => prev.filter(p => p.userId !== userId));
            }
        };

        const handleUpdateEmojis = ({ userId, emojis, sessionId }) => {
            console.log("🔄 useParticipants: Handling emoji update for", userId, "with emojis:", emojis);
            if (String(sessionId) === String(currentSessionId)) {
                setParticipants(prev =>
                    prev.map(p =>
                        p.userId === userId
                            ? { ...p, emojis: Array.isArray(emojis) ? emojis : [emojis] }
                            : p
                    )
                );
            } else {
                console.log("❌ useParticipants: Session mismatch for emoji update. Current:", currentSessionId, "Received:", sessionId);
            }
        };

        const handleUpdateStudentPoints = ({ studentId, points, sessionId }) => {
            if (String(sessionId) === String(currentSessionId)) {
                setParticipants(prev =>
                    prev.map(p =>
                        p.userId === studentId ? { ...p, points } : p
                    )
                );
            }
        };

        const handleClearAll = (payload) => {
            console.log("🧹 useParticipants: Received clearAllEmojis event", payload);
            setParticipants(prev =>
                prev.map(p => ({ ...p, emojis: [] }))
            );
        };

        socket.on('initialParticipants', handleInitialParticipants);
        socket.on('userJoined', handleUserJoined);
        socket.on('userLeft', handleUserLeft);
        socket.on('updateEmojis', handleUpdateEmojis);
        socket.on('updateStudentPoints', handleUpdateStudentPoints);
        socket.on('clearAllEmojis', handleClearAll);

        return () => {
            socket.off('initialParticipants', handleInitialParticipants);
            socket.off('userJoined', handleUserJoined);
            socket.off('userLeft', handleUserLeft);
            socket.off('updateEmojis', handleUpdateEmojis);
            socket.off('updateStudentPoints', handleUpdateStudentPoints);
            socket.off('clearAllEmojis', handleClearAll);
        };
    }, [socket, currentSessionId]);

    return { participants, setParticipants };
};
