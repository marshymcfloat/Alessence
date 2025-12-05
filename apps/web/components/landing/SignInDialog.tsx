import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import AuthLoginForm from "./AuthLoginForm";
import { LogIn } from "lucide-react";

const SignInDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 rounded-lg px-8 py-6 text-base font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200">
          <span className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Sign In
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Sign In
          </DialogTitle>
          <DialogDescription className="text-center text-sm pt-2">
            Access your study dashboard
          </DialogDescription>
        </DialogHeader>

        <AuthLoginForm />
      </DialogContent>
    </Dialog>
  );
};

export default SignInDialog;
