"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { QuizEngine } from "@/components/QuizEngine";
import { LogOut, LogIn } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.email === "admin@quizlift.com";
  const isLoading = status === "loading";

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col items-center">
      <header className="w-full flex justify-between items-center p-6 border-b border-neutral-800 bg-neutral-900 shadow-sm">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
          QuizLift
        </h1>
        <div>
          {!isLoading && !session ? (
            <button
              onClick={() => signIn()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md font-medium transition-colors flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
          ) : null}
          {!isLoading && session ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-400">
                Hi, <span className="text-neutral-200">{session.user?.name}</span>
              </span>
              {isAdmin && (
                <span className="text-xs font-semibold bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full border border-indigo-500/30">
                  Admin
                </span>
              )}
              <button
                onClick={() => signOut()}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-md text-neutral-300 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <section className="flex-1 w-full max-w-5xl p-6 flex flex-col items-center justify-center">
        {!isLoading && !session && (
          <div className="text-center max-w-lg space-y-6">
            <h2 className="text-4xl font-extrabold tracking-tight">
              Transform <span className="text-indigo-400">PDFs</span> into Interactive Quizzes
            </h2>
            <p className="text-neutral-400 text-lg">
              Sign in to use AI to generate contextual learning experiences from your documents instantly.
            </p>
            <button
              onClick={() => signIn()}
              className="mt-4 px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
            >
              Get Started for Free
            </button>
          </div>
        )}

        {!isLoading && session && (
          <div className="w-full">
            <h2 className="text-3xl font-bold mt-4 mb-12 text-center bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Create Your Next Quiz
            </h2>
            <QuizEngine />
          </div>
        )}
      </section>
    </main>
  );
}
