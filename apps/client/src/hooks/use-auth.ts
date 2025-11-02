import { logIn, me, signUp } from "@/services/authServices";
import type { User } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";

export const useAuthUser = () => {
  return useQuery<User>({
    queryKey: ["auth-user"],
    queryFn: me,
  });
};

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: logIn,
    onError(error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Login failed");
        return;
      }

      toast.error("An unknown error has occurred while trying to login");
    },
  });
};

export const useSignUpMutation = () => {
  return useMutation({
    mutationFn: signUp,

    onError(error, variables, onMutateResult, context) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message);
        return;
      }

      toast.error(
        "An unknown error has occurred while trying to create account"
      );
    },
  });
};
