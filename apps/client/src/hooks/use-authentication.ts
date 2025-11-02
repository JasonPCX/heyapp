import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { useBoundStore } from '@/stores/useBoundStore';
import { useAuthUser } from '@/hooks/use-auth';

export function useAuthentication(token: string | null) {
  const navigate = useNavigate();
  const setUser = useBoundStore((state) => state.setUser);
  
  const { data, error, isLoading, isError } = useAuthUser();

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      toast.error("Session expired. Please login again");
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  // Set user data when available
  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data, setUser]);

  // Handle authentication errors
  useEffect(() => {
    if (isError) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message);
      }
      navigate("/login", { replace: true });
    }
  }, [isError, navigate, error]);

  return { isLoading };
}