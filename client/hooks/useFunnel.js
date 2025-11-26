import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_ROUTES } from '@/config';

export function useFunnel() {
  const [participants, setParticipants] = useState([]);
  const [funnellingResponse, setFunnellingResponse] = useState(null); // Store full response
  const [funnellingMessage, setFunnellingMessage] = useState(null);
  const [loadingParticipants, setLoadingParticipants] = useState(true);
  const [loadingFunnelling, setLoadingFunnelling] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchParticipants() {
      try {
        const res = await axios.get(API_ROUTES.FUNNEL_SERVICE.GET_PARTICIPANTS);
        if (res.data?.status === 200 && Array.isArray(res.data.data)) {
          setParticipants(res.data.data);
        } else {
          throw new Error("Unexpected participants response format");
        }
      } catch (err) {
        console.error("Error fetching participants:", err);
        setError(err);
      } finally {
        setLoadingParticipants(false);
      }
    }

    fetchParticipants();
  }, []);

  const fetchFunnellingData = async (id) => {
    setLoadingFunnelling(true);
    setFunnellingResponse(null);
    setFunnellingMessage(null);
    try {
      const res = await axios.get(`${API_ROUTES.FUNNEL_SERVICE.FUNNELLING}?id=${id}`);
      if (res.data?.status === 200) {
        setFunnellingResponse(res.data);
        return res.data;
      } else if (res.data?.status === 404) {
        setFunnellingMessage(res.data.message);
      } else {
        throw new Error("Unexpected funnelling response format");
      }
    } catch (err) {
      console.error("Error fetching funnelling data:", err);
      setError(err);
    } finally {
      setLoadingFunnelling(false);
    }
  };

  return {
    participants,
    funnellingData: funnellingResponse?.data,
    funnellingResponse,
    funnellingMessage,
    loadingParticipants,
    loadingFunnelling,
    error,
    fetchFunnellingData,
  };
}