"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      <div className="min-h-[calc(100dvh-40px)] bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4"
          >
            Converse with your <span className="text-primary">Idols</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground text-lg md:text-xl max-w-2xl mb-12"
          >
            Persona AI lets you have interactive, real-time conversations with
            accurate AI representations of your favorite personalities.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            {/* Persona 1: Angry GF */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col backdrop-blur-sm bg-card/90">
                <CardHeader className="flex flex-col items-center">
                  <div className="w-32 h-32 relative rounded-full overflow-hidden mb-4 border-4 border-primary/20">
                    <Image
                      src="/images/angry_gf.png"
                      alt="Angry Girlfriend"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <CardTitle className="text-2xl">Angry Girlfriend</CardTitle>
                  <CardDescription>Dramatic, Suspicious & Funny</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">
                    Chat with your Angry Girlfriend. She's passive-aggressive, overthinks everything, and just wants your attention. Proceed with caution.
                  </p>
                </CardContent>
                <CardFooter className="flex justify-center mt-auto">
                  <Link href="/chat?persona=angry_gf">
                    <Button variant="outline">Chat with Her</Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Persona 2: Tech Bro */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col backdrop-blur-sm bg-card/90">
                <CardHeader className="flex flex-col items-center">
                  <div className="w-32 h-32 relative rounded-full overflow-hidden mb-4 border-4 border-primary/20">
                    <Image
                      src="/images/tech_bro.png"
                      alt="Analogy Tech Bro"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <CardTitle className="text-2xl">Analogy Tech Bro</CardTitle>
                  <CardDescription>Software Engineer & Analogist</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">
                    Discuss advanced web concepts, architecture, and system design. He'll explain everything using a real-world analogy.
                  </p>
                </CardContent>
                <CardFooter className="flex justify-center mt-auto">
                  <Link href="/chat?persona=tech_bro">
                    <Button variant="outline">Chat with Him</Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
