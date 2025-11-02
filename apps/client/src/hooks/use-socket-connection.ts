import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useBoundStore } from '@/stores/useBoundStore';
import { removeAuthToken } from '@/services/tokenService';
import socket, { connectSocket, disconnectSocket } from '@/lib/sockets';

export function useSocketConnection(token: string | null, isAuthenticated: boolean) {
  const navigate = useNavigate();
  const clearUser = useBoundStore((state) => state.clearUser);

  useEffect(() => {
    if (token && isAuthenticated) {
      socket.auth = { token };
      connectSocket();
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    const handleConnectError = (err: any) => {
      if (err.context?.status === 401) {
        disconnectSocket();
        clearUser();
        removeAuthToken();
        toast.error("Authentication failed. Please login again");
        navigate("/login", { replace: true });
      }
    };

    const handleDisconnect = (reason: string) => {
      if (reason === "io server disconnect") {
        toast.error("Disconnected by server. Please login again");
        clearUser();
        removeAuthToken();
        navigate("/login", { replace: true });
      }
    };

    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
    };
  }, [navigate, clearUser]);
}