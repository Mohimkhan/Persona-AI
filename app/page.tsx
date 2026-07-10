import Link from "next/link";
import Image from "next/image";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Footer from "@/components/common/Footer";

export default function Home() {
  return (
    <>
      <div className="min-h-[calc(100dvh-40px)] bg-background">
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

        <main className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Converse with your <span className="text-primary">Idols</span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mb-12">
            Persona AI lets you have interactive, real-time conversations with
            accurate AI representations of your favorite personalities.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            {/* Persona 1: Hitesh Chowdhury */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-col items-center">
                <div className="w-32 h-32 relative rounded-full overflow-hidden mb-4 border-4 border-primary/20">
                  <Image
                    src="/images/hitesh_choudhary.png"
                    alt="Hitesh Chowdhury"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <CardTitle className="text-2xl">Hitesh Chowdhury</CardTitle>
                <CardDescription>Tech Educator & YouTuber</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Chat with Hitesh about web development, programming
                  fundamentals, tech careers, and content creation.
                </p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Link href="/chat?persona=hitesh">
                  <Button variant="outline">Chat with Hitesh</Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Persona 2: Piyush Garg */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-col items-center">
                <div className="w-32 h-32 relative rounded-full overflow-hidden mb-4 border-4 border-primary/20">
                  <Image
                    src="/images/piyush_garg.png"
                    alt="Piyush Garg"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <CardTitle className="text-2xl">Piyush Garg</CardTitle>
                <CardDescription>Software Engineer & Creator</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Discuss advanced web concepts, software architecture, Next.js,
                  and system design with Piyush.
                </p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Link href="/chat?persona=piyush">
                  <Button variant="outline">Chat with Piyush</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
