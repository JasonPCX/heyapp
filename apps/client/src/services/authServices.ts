import { API } from "./apiInstance";
import type { TSignUpFormSchema } from "@/pages/SignUp/SignUp";
import type { TLogInFormSchema } from "@/pages/LogIn/LogIn";
import type { LogInResponse, User } from "@/types/user";
import type { SuccessResponse } from "@/types/api";

const RESOURCE = "auth";

export async function signUp(data: TSignUpFormSchema) {
  const response = await API.post<TSignUpFormSchema, SuccessResponse<User>>(
    `/${RESOURCE}/signup`,
    data
  );
  return response.data;
}

export async function logIn(data: TLogInFormSchema) {
  const response = await API.post<TLogInFormSchema, LogInResponse>(
    `/${RESOURCE}/login`,
    data
  );
  return response.data;
}

export async function me() {
  const response = await API.get<User>(`/${RESOURCE}/me`);
  return response.data;
}

export async function resetPassword(data: { email: string }) {
  const response = await API.post<typeof data, SuccessResponse<null>>(
    `/${RESOURCE}/reset-password`,
    data
  );
  return response.data;
}

export async function recoverPassword(data: {
  token: string;
  password: string;
}) {
  const response = await API.post<typeof data, SuccessResponse<null>>(
    `/${RESOURCE}/recover-password`,
    data
  );
  return response.data;
}
