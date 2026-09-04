"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeSwitcher } from "../ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { appName } from "@/constants";

/**
 * TODO: Create Logo with the two existing persona, one in little tilt to left and another little tilt to right and both in circle, experiemnt with AI
 * TODO: Tech Bro will explain with animation with canvas (first idea)
 */

const Header = () => {
  return (
    <header className="container mx-auto px-4 py-4 flex items-center justify-between border-b">
      <Link href="/">
        <div className="relative h-10 w-48 sm:w-56 mt-2">
          <Image
            src="/final_personal_logo.png"
            alt="Persona AI"
            fill
            className="block object-contain object-left"
          />
          <div className="absolute font-semibold top-1/2 -translate-y-1/2 translate-x-12">
            <h1>{appName}</h1>
          </div>
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
