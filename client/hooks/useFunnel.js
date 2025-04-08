import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_ROUTES } from '@/config';

export function useFunnel() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchParticipants() {
      try {
        const response = await axios.get(API_ROUTES.FUNNEL_SERVICE.GET_PARTICIPANTS);

        if (response.data?.status === 200 && Array.isArray(response.data.data)) {
          setParticipants(response.data.data);
        } else {
          throw new Error("Unexpected response format");
        }

      } catch (err) {
        console.error("Error fetching participants:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchParticipants();
  }, []);

  return { participants, loading, error };
}
