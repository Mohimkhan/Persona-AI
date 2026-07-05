"use client";

import Image from "next/image";
import Button from "./Button";
import { handleGithubLogin } from "@/app/actions/social";

export const GithubLoginBtn = () => {
  return (
    <div className="flex gap-2 justify-center items-center bg-gray-600 text-white flex-1 px-1 py-2 rounded-md hover:bg-black hover:border-[1px] hover:border-white">
      <Image
        src="/icons/githubicon.png"
        alt="github"
        width={20}
        height={20}
      />
      <Button
        innerText="Github"
        onClick={async () => await handleGithubLogin()}
      />
    </div>
  );
};
