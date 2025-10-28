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
import { LogIn } from "lucide-react";

const AuthLoginForm = () => {
  const form = useForm<AuthLoginTypes>({
    resolver: zodResolver(authLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const formInputs = Object.keys(form.getValues()) as (keyof AuthLoginTypes)[];

  const disabled = form.formState.isValidating || form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form action="" className="space-y-4">
        {formInputs.map((input) => (
          <FormField
            key={input}
            control={form.control}
            name={input}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="capitalize">{input}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <div className="flex mt-12">
          <Button disabled={disabled} className=" ml-auto">
            <LogIn /> Sign in
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AuthLoginForm;
