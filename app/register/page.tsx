import { GithubLoginBtn } from "@/components/common/GithubLoginBtn";
import { GoogleLoginBtn } from "@/components/common/GoogleLoginBtn";

export default function RegisterPage() {
  return (
    <div className="flex justify-center items-center min-h-[80dvh]">
      <div className="p-4 rounded-lg w-full flex flex-col h-[150px] justify-center min-w-[400px] max-w-[800px]  bg-transparent">
        <h1 className="text-2xl font-bold mb-4">Register With</h1>
        <div className="flex flex-col items-stretch gap-2">
          <GoogleLoginBtn />
          <GithubLoginBtn />
        </div>
      </div>
    </div>
  );
}
