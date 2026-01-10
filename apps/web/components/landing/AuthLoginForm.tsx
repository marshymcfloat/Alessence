"use client";

import { useForm } from "react-hook-form";
import { authLoginSchema, AuthLoginTypes } from "@repo/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { LoaderCircle, LogIn, Lock, Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authLoginAction } from "@/lib/actions/authActions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type AuthLoginFormProps = {
  onSuccess?: () => void;
};

const AuthLoginForm = ({ onSuccess }: AuthLoginFormProps = {}) => {
  const form = useForm<AuthLoginTypes>({
    resolver: zodResolver(authLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const router = useRouter();

  const { isPending, mutate } = useMutation({
    mutationFn: authLoginAction,
    onSuccess: (data) => {
      if (!data.success) {
        toast.error(data.error || "Login failed. Please try again.");
        return;
      }

      toast.success(data.message || "Login successful!");
      onSuccess?.();
      router.push(`/${data.data?.user.id}/dashboard`);
      router.refresh();
    },
    onError: (error) => {
      console.error("Mutation failed unexpectedly:", error);

      if (error instanceof Error) {
        toast.error(`An unexpected error occurred: ${error.message}`);
      } else {
        toast.error(
          "An unexpected error occurred. Please check your connection and try again."
        );
      }
    },
  });

  const formInputs = Object.keys(form.getValues()) as (keyof AuthLoginTypes)[];

  const disabled =
    isPending || form.formState.isValidating || form.formState.isSubmitting;

  function handleSubmission(values: AuthLoginTypes) {
    mutate(values);
  }
  return (
    <Form {...form}>
      <form
        action=""
        onSubmit={form.handleSubmit(handleSubmission)}
        className="space-y-6"
      >
        <div className="space-y-4">
          {formInputs.map((input) => (
            <FormField
              key={input}
              control={form.control}
              name={input}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="capitalize text-slate-700 dark:text-slate-300 ml-1">
                    {input}
                  </FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <div className="absolute left-3 top-3 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">
                        {input === "email" ? (
                          <Mail className="h-5 w-5" />
                        ) : (
                          <Lock className="h-5 w-5" />
                        )}
                      </div>
                      <Input
                        {...field}
                        type={input === "email" ? "text" : "password"}
                        className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 pl-10 h-12 rounded-xl text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300"
                        placeholder={
                          input === "email" ? "juan@gmail.com" : "••••••••"
                        }
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500 dark:text-red-400 ml-1" />
                </FormItem>
              )}
            />
          ))}
        </div>

        <div className="pt-2">
          <Button
            disabled={disabled}
            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-500/20 group"
          >
            {isPending ? (
              <LoaderCircle className="animate-spin mr-2 h-5 w-5 text-white" />
            ) : (
              <LogIn className="mr-2 h-5 w-5 text-white group-hover:translate-x-1 transition-transform" />
            )}
            <span className="text-white font-semibold text-lg">Sign in</span>
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AuthLoginForm;
