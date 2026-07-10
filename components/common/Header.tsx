"use client";

import { Link } from "lucide-react";
import { ThemeSwitcher } from "../ThemeSwitcher";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="container mx-auto px-4 py-4 flex items-center justify-between border-b">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
          PA
        </div>
        <h1 className="text-sm md:text-xl font-bold text-foreground">
          Persona AI
        </h1>
      </div>
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
