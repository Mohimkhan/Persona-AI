"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeSwitcher } from "../ThemeSwitcher";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="container mx-auto px-4 py-4 flex items-center justify-between border-b">
      <Link href="/">
        <div className="relative h-10 w-48 sm:w-56 mt-2">
          <Image
            src="/logo-text.png"
            alt="Persona AI"
            fill
            className="hidden dark:block object-contain object-left"
          />
          <Image
            src="/logo-text-light.png"
            alt="Persona AI"
            fill
            className="block dark:hidden object-contain object-left"
          />
        </div>
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/chat">
          <Button variant="default">Chat Now</Button>
        </Link>
        <ThemeSwitcher />
      </div>
    </header>
  );
};
export default Header;
