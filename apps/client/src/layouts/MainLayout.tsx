import React from "react";
import { Outlet } from "react-router";

import { getAuthToken } from "@/services/tokenService";
import { useBoundStore } from "@/stores/useBoundStore";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useSocketConnection } from "@/hooks/use-socket-connection";
import { useAuthentication } from "@/hooks/use-authentication";
import { useIncomingCalls } from "@/hooks/use-incoming-calls";
import { useFriendRequestsDialog } from "@/hooks/use-friend-requests-dialog";
import { useListenNewMessage } from "@/hooks/use-messages";
import IncomingCallDialog from "@/components/calls/incoming-call-alert-dialog";
import NewFriendRequestDialog from "@/components/friends/new-friend-request-dialog";
import { SessionVerificationLoader } from "@/components/session-verification-loader";

function MainLayout() {
  const token = getAuthToken();
  const isAuthenticated = useBoundStore((state) => state.isAuthenticated);

  // Handle authentication and user data
  const { isLoading } = useAuthentication(token);

  // Handle socket connection
  useSocketConnection(token, isAuthenticated);

  // Handle incoming calls
  const {
    showDialog: showIncomingCallDialog,
    setShowDialog: setShowIncomingCallDialog,
    callInformation,
    onAnswer,
    onHangUp,
  } = useIncomingCalls();

  // Handle friend requests
  const {
    showDialog: showNewFriendRequestDialog,
    setShowDialog: setShowNewFriendRequestDialog,
    newFriendRequest,
    onAcceptFriendRequest,
    onRejectFriendRequest,
  } = useFriendRequestsDialog();

  // Listen for new messages
  useListenNewMessage();

  // Show loading state
  if (token !== null && isLoading) {
    return <SessionVerificationLoader />;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <Outlet />
      
      <IncomingCallDialog
        open={showIncomingCallDialog}
        setOpen={setShowIncomingCallDialog}
        incomingCallInfo={callInformation}
        onAnswer={onAnswer}
        onHangUp={onHangUp}
      />
      
      <NewFriendRequestDialog
        open={showNewFriendRequestDialog}
        setOpen={setShowNewFriendRequestDialog}
        newFriendRequest={newFriendRequest}
        onAcceptFriendRequest={onAcceptFriendRequest}
        onRejectFriendRequest={onRejectFriendRequest}
      />
    </SidebarProvider>
  );
}

export default MainLayout;
