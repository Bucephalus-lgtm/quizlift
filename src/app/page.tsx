"use client";

import React, { useState } from "react";
import { QuizEngine } from "@/components/QuizEngine";
import { FlashcardEngine } from "@/components/FlashcardEngine";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BookOpen, Layers } from "lucide-react";

export default function Home() {
  const [activeMode, setActiveMode] = useState<"quiz" | "flashcards">("quiz");

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 flex flex-col items-center transition-colors">
      <header className="w-full flex justify-between items-center px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm transition-colors">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
          QuizLift
        </h1>
        <ThemeToggle />
      </header>

      <section className="flex-1 w-full max-w-5xl p-6 flex flex-col items-center justify-center">
        <div className="text-center max-w-lg space-y-6 mb-12">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Transform <span className="text-indigo-600 dark:text-indigo-400">Knowledge</span> into Interactive Modules
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            Use AI to generate contextual learning experiences from your documents or the latest major current affairs headlines.
          </p>
        </div>

        <div className="w-full flex justify-center mb-10">
          <div className="flex bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl p-1 shadow-inner transition-colors">
            <button
              onClick={() => setActiveMode("quiz")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${activeMode === "quiz"
                ? "bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                }`}
            >
              <BookOpen className="w-4 h-4" /> Practice Quizzes
            </button>
            <button
              onClick={() => setActiveMode("flashcards")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${activeMode === "flashcards"
                ? "bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                }`}
            >
              <Layers className="w-4 h-4" /> Study Flashcards
            </button>
          </div>
        </div>

        <div className="w-full">
          <h2 className="text-3xl font-bold mt-4 mb-8 text-center bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            {activeMode === "quiz" ? "Create Your Next Quiz" : "Generate Study Flashcards"}
          </h2>
          {activeMode === "quiz" ? <QuizEngine /> : <FlashcardEngine />}
        </div>
      </section>

      <footer className="w-full text-center py-6 text-sm text-neutral-500 dark:text-neutral-600 border-t border-neutral-200 dark:border-neutral-900 mt-12 flex flex-col items-center space-y-2 transition-colors">
        <p>Built with ❤️ for rapid, interactive learning.</p>
        <p>&copy; {new Date().getFullYear()} Bhargab Nath</p>
      </footer>
    </main>
  );
}
