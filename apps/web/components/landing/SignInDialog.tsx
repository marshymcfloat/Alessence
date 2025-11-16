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
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="group relative bg-linear-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 rounded-full px-8 py-6 text-lg font-semibold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
            <span className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Get Started
            </span>
            <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-3xl font-bold bg-linear-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Welcome to Alessence
            </DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              Sign in to access your personal study space
            </DialogDescription>
          </DialogHeader>

          <AuthLoginForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SignInDialog;
