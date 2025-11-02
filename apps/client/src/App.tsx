import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "@/lib/dayjs";

import AuthLayout from "@/layouts/AuthLayout";
import MainLayout from "@/layouts/MainLayout";
import LogIn from "@/pages/LogIn/LogIn";
import SignUp from "@/pages/SignUp/SignUp";
import NotFound from "@/pages/NotFound/NotFound";
import Chats from "@/pages/Chats/Chats";
import Settings from "@/pages/Settings/Settings";
import { Toaster } from "@/components/ui/sonner";
import Account from "@/pages/Account/Account";
import Friends from "@/pages/Friends/Friends";
import Call from "./pages/Call/Call";

const queryClient = new QueryClient();

function App() {
  return (
    <>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route index element={<Navigate to={"/chats"} />} />
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LogIn />} />
              <Route path="/signup" element={<SignUp />} />
            </Route>
            <Route element={<MainLayout />}>
              <Route path="/chats/:chatId?" element={<Chats />} />
              <Route path="/chats/:chatId/call/:callId?" element={<Call />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/account" element={<Account />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ReactQueryDevtools initialIsOpen={false} />
          <Toaster richColors position="top-right" />
        </QueryClientProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
