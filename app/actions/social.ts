import { authClient } from "@/lib/auth-client";
import { showToast } from "@/lib/utils/toast";
import { toast } from "react-toastify";

export const handleGoogleLogin = async () => {
  await authClient.signIn.social({
    provider: "google",
    callbackURL: "/",
    fetchOptions: {
      onSuccess: () => {
        showToast({
          message: "Successfully Logged In with Google",
          type: "success",
        });
      },
      onError: () => {
        toast.error(`Failed to Log In with Google`);
      },
    },
  });
};

export const handleGithubLogin = async () => {
  await authClient.signIn.social({
    provider: "github",
    callbackURL: "/",
    fetchOptions: {
      onSuccess: () => {
        showToast({
          message: "Successfully Logged In with Github",
          type: "success",
        });
      },
      onError: () => {
        showToast({
          message: "Failed to Log In with Github",
          type: "error",
        });
      },
    },
  });
};
