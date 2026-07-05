import { toast, TypeOptions } from "react-toastify";
import { cn } from "./cn";

export const showToast = ({
  message,
  type,
  extraClasses,
}: {
  message: string;
  type: TypeOptions;
  extraClasses?: string;
}) => {
  return toast(message, {
    className: cn("z-50 bg-black border border-primary-color", extraClasses),
    type: type,
  });
};
