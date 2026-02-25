"use client";

import { QuizEngine } from "@/components/QuizEngine";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col items-center">
      <header className="w-full flex justify-center items-center p-6 border-b border-neutral-800 bg-neutral-900 shadow-sm">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
          QuizLift
        </h1>
      </header>

      <section className="flex-1 w-full max-w-5xl p-6 flex flex-col items-center justify-center">
        <div className="text-center max-w-lg space-y-6 mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight">
            Transform <span className="text-indigo-400">PDFs</span> into Interactive Quizzes
          </h2>
          <p className="text-neutral-400 text-lg">
            Use AI to generate contextual learning experiences from your documents instantly.
          </p>
        </div>

        <div className="w-full">
          <h2 className="text-3xl font-bold mt-4 mb-8 text-center bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Create Your Next Quiz
          </h2>
          <QuizEngine />
        </div>
      </section>
    </main>
  );
}
