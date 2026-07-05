"use client";

import Image from "next/image";
import Button from "./Button";
import { handleGoogleLogin } from "@/app/actions/social";

export const GoogleLoginBtn = () => {
  return (
    <div className="flex gap-2 justify-center items-center bg-gray-600 text-white flex-1 px-1 py-2 rounded-md hover:bg-black hover:border-[1px] hover:border-white">
      <Image
        src="/icons/googleicon.png"
        alt="google"
        width={20}
        height={20}
      />
      <Button
        innerText="Google"
        onClick={async () => await handleGoogleLogin()}
      />
    </div>
  );
};
