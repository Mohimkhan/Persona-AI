import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  innerText: string;
}

export default function Button({ innerText, ...props }: ButtonProps) {
  return <button {...props}>{innerText}</button>;
}
