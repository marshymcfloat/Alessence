"use client";

import SignInDialog from "@/components/landing/SignInDialog";
import Image from "next/image";
import { motion } from "framer-motion";

const Page = () => {
  /* recommit*/
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-linear-to-br from-pink-200/20 via-purple-200/20 to-blue-200/20 dark:from-pink-900/10 dark:via-purple-900/10 dark:to-blue-900/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <section className="relative flex flex-col items-center justify-center px-4 py-12 w-full max-w-2xl mx-auto">
        <motion.div
          className="flex flex-col items-center gap-8 text-center"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.2,
                delayChildren: 0.1,
              },
            },
          }}
        >
          <motion.div
            className="relative"
            variants={{
              hidden: { scale: 0.8, opacity: 0 },
              visible: {
                scale: 1,
                opacity: 1,
                transition: {
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  duration: 0.6,
                },
              },
            }}
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Image
                src="/logo.png"
                width={120}
                height={120}
                alt="Alessence Logo"
                priority
                className="relative drop-shadow-lg"
                unoptimized={false}
              />
            </motion.div>
          </motion.div>

          <motion.div
            className="space-y-3"
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: {
                y: 0,
                opacity: 1,
                transition: {
                  type: "spring",
                  stiffness: 100,
                  damping: 12,
                  duration: 0.5,
                },
              },
            }}
          >
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
              <span className="bg-linear-to-r from-pink-600 via-purple-600 to-blue-600 dark:from-pink-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                Alessence
              </span>
            </h1>
            <motion.p
              className="text-lg text-slate-600 dark:text-slate-400 sm:text-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Your personal study space
            </motion.p>
          </motion.div>

          <motion.p
            className="max-w-md text-base text-slate-600 dark:text-slate-400"
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: {
                y: 0,
                opacity: 1,
                transition: {
                  delay: 0.3,
                  duration: 0.5,
                },
              },
            }}
          >
            Manage your tasks, organize your files, and generate AI-powered
            exams for your accountancy studies.
          </motion.p>

          <motion.div
            className="pt-4"
            variants={{
              hidden: { y: 20, opacity: 0, scale: 0.9 },
              visible: {
                y: 0,
                opacity: 1,
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 150,
                  damping: 12,
                  delay: 0.5,
                },
              },
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <SignInDialog />
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
};

export default Page;
