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

const SignInDialog = () => {
  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="bg-pink-500 hover:bg-pink-500/80 rounded-full px-8 hover:-translate-y-0.5 cursor-pointer font-medium transition-all duration-200 relative">
            Let's Begin
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className=" text-center text-2xl font-bold text-slate-900">
              Alessence
            </DialogTitle>
            <DialogDescription className="text-center">
              Goodluck, baby! galingan mo!
            </DialogDescription>
          </DialogHeader>

          <AuthLoginForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SignInDialog;
