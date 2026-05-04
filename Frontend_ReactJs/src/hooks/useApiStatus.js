import { useEffect, useState } from "react";
import { getHealth } from "../services/healthService";

export function useApiStatus() {
  const [status, setStatus] = useState("UNKNOWN");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [backendInfo, setBackendInfo] = useState("");

  useEffect(() => {
    let active = true;

    async function checkStatus() {
      try {
        const response = await getHealth();
        if (active) {
          setStatus(response.data?.status ?? "UP");
          setBackendInfo(`${response.data?.service ?? "API"} is reachable`);
        }
      } catch (requestError) {
        if (active) {
          setStatus("OFFLINE");
          setError(requestError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    checkStatus();

    return () => {
      active = false;
    };
  }, []);

  return { status, loading, error, backendInfo };
}
