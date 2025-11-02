import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router";

import { signUpFormSchema } from "../SignUp/SignUp";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBoundStore } from "@/stores/useBoundStore";
import { saveAuthToken } from "@/services/tokenService";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLoginMutation } from "@/hooks/use-auth";

const logInFormSchema = signUpFormSchema.pick({
  email: true,
  password: true,
});

export type TLogInFormSchema = z.infer<typeof logInFormSchema>;

const initialValues = {
  email: "",
  password: "",
};

function LogIn() {
  const [showPassword, setShowPassword] = useState(false);
  const setUser = useBoundStore((state) => state.setUser);

  const form = useForm<TLogInFormSchema>({
    resolver: zodResolver(logInFormSchema),
    defaultValues: initialValues,
  });

  const mutation = useLoginMutation();

  const navigate = useNavigate();

  function onSubmit(values: TLogInFormSchema) {
    mutation.mutate(values, {
      onSuccess(data, _variables, _onMutateResult, _context) {
        toast.success(data.message || "Login successful");
        setUser(data.user);
        saveAuthToken(data.token);
        navigate("/chats");
      },
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter you email and password to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full">Log in</Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <p>
          Don't have an account?&nbsp;
          <Link to="/signup" className="font-bold hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default LogIn;
