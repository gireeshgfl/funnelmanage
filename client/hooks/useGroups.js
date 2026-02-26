import { useState, useCallback, useEffect } from "react";
import apiClient from "@/utils/axiosinterceptor";
import { API_ROUTES } from "@/config";

export function useGroups() {
    const [groups, setGroups] = useState([]);
    const [participants, setParticipants] = useState({ trainers: [], students: [], others: [] });
    const [loading, setLoading] = useState(false);
    const [participantsLoading, setParticipantsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [participantsError, setParticipantsError] = useState(null);
    const [feedbackMessage, setFeedbackMessage] = useState("");

    const fetchGroups = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(API_ROUTES.FUNNEL_SERVICE.GET_GROUPS);
            if (response.data?.status === 200) {
                setGroups(response.data.data || []);
            } else {
                throw new Error(response.data?.message || "Failed to fetch groups");
            }
        } catch (err) {
            console.error("Error fetching groups:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchParticipants = useCallback(async () => {
        setParticipantsLoading(true);
        setParticipantsError(null);
        try {
            const response = await apiClient.get(API_ROUTES.QUESTION_SERVICE.GET_PARTICIPANTS);
            if (response.data?.status === 200 && response.data?.data) {
                setParticipants(response.data.data);
            } else {
                throw new Error("Failed to load participants data");
            }
        } catch (err) {
            console.error("Error fetching participants:", err);
            setParticipantsError(err);
        } finally {
            setParticipantsLoading(false);
        }
    }, []);

    const createGroup = useCallback(async (groupData) => {
        setLoading(true);
        setFeedbackMessage("");
        try {
            const response = await apiClient.post(
                API_ROUTES.FUNNEL_SERVICE.SAVE_GROUP,
                groupData
            );

            if (response.data?.status === 200 || response.data?.status === 201) {
                setFeedbackMessage("Group created successfully!");
                await fetchGroups();
                return true;
            } else {
                setFeedbackMessage(response.data?.message || "Failed to create group");
                return false;
            }
        } catch (err) {
            console.error("Error creating group:", err);
            setFeedbackMessage(err.response?.data?.message || "Error occurred while creating group.");
            return false;
        } finally {
            setLoading(false);
        }
    }, [fetchGroups]);

    useEffect(() => {
        fetchGroups();
        fetchParticipants();
    }, [fetchGroups, fetchParticipants]);

    return {
        groups,
        participants,
        loading,
        participantsLoading,
        error,
        participantsError,
        feedbackMessage,
        setFeedbackMessage,
        fetchGroups,
        fetchParticipants,
        createGroup
    };
}
