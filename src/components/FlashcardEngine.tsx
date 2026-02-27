import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, Brain, BookOpen, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type Flashcard = {
    front: string;
    back: string;
};

export function FlashcardEngine() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);

    const [currentCardIdx, setCurrentCardIdx] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [numFlashcards, setNumFlashcards] = useState(10);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/pdf": [".pdf"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
            "application/msword": [".doc"]
        },
        maxFiles: 1,
    });

    const handleGenerateFlashcards = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("num_flashcards", numFlashcards.toString());

            const res = await axios.post("/api/python/upload_flashcards", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res?.data?.status === "success") {
                setFlashcards(res.data.flashcards);
            }
        } catch (error: any) {
            console.error("Failed to generate flashcards", error);
            const serverError = error.response?.data?.detail;
            if (serverError) {
                alert(`API Error: ${serverError}`);
            } else {
                alert("Error generating flashcards. Is the backend running and API key set? Try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const prevCard = () => {
        if (currentCardIdx > 0) {
            setIsFlipped(false);
            setCurrentCardIdx((prev) => prev - 1);
        }
    };

    const nextCard = () => {
        if (!flashcards) return;
        if (currentCardIdx < flashcards.length - 1) {
            setIsFlipped(false);
            setCurrentCardIdx((prev) => prev + 1);
        } else {
            // End of flashcards
            setCurrentCardIdx(flashcards.length);
        }
    };

    const resetFlashcards = () => {
        setFile(null);
        setFlashcards(null);
        setCurrentCardIdx(0);
        setIsFlipped(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-6">
                <Loader2 className="w-16 h-16 animate-spin text-indigo-500" />
                <h3 className="text-xl font-medium text-neutral-300">Summoning AI capabilities...</h3>
                <p className="text-neutral-500">Generating beautiful flashcards from your text.</p>
            </div>
        );
    }

    // Flashcards completion screen
    if (flashcards && currentCardIdx >= flashcards.length) {
        return (
            <Card className="w-full max-w-2xl mx-auto bg-neutral-900 border-neutral-800 text-neutral-100 shadow-xl overflow-hidden glassmorphism">
                <CardContent className="flex flex-col items-center p-12 space-y-8">
                    <Brain className="w-24 h-24 text-indigo-400" />
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-500 text-center">
                        Flashcards Completed!
                    </h2>
                    <div className="text-xl text-neutral-400 text-center">
                        You've reviewed all {flashcards.length} cards. Great job!
                    </div>
                    <Button onClick={resetFlashcards} className="bg-indigo-600 hover:bg-indigo-700 w-full max-w-sm mt-4">
                        Upload Another Document
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Active flashcards screen
    if (flashcards && currentCardIdx < flashcards.length) {
        const card = flashcards[currentCardIdx];
        const progressVal = ((currentCardIdx) / flashcards.length) * 100;

        return (
            <div className="w-full max-w-3xl mx-auto">
                <div className="w-full flex items-center justify-between mb-4 text-sm font-medium text-neutral-400">
                    <span>Card {currentCardIdx + 1} of {flashcards.length}</span>
                    <span className="flex items-center gap-2">
                        <span className="text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-md flex items-center gap-1"><Brain size={14} /> Flashcard Mode</span>
                    </span>
                </div>
                <Progress value={progressVal} className="h-2 mb-8 bg-neutral-800" indicatorClass="bg-indigo-500" />

                <div className="relative w-full aspect-video perspective-1000 mb-8 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentCardIdx + (isFlipped ? "-back" : "-front")}
                            initial={{ rotateX: isFlipped ? -90 : 90, opacity: 0 }}
                            animate={{ rotateX: 0, opacity: 1 }}
                            exit={{ rotateX: isFlipped ? 90 : -90, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 w-full h-full"
                        >
                            <Card className={cn("w-full h-full flex items-center justify-center p-8 border-2 transition-all relative overflow-hidden", isFlipped ? "bg-indigo-900/40 border-indigo-500/50" : "bg-neutral-900/80 border-neutral-700 hover:border-indigo-400")}>
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
                                <CardTitle className="text-2xl md:text-3xl text-center leading-relaxed font-semibold text-neutral-100">
                                    {isFlipped ? card.back : card.front}
                                </CardTitle>
                                <div className="absolute font-light bottom-4 right-4 text-xs text-neutral-500">
                                    Click card to flip
                                </div>
                            </Card>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="mt-8 flex justify-between items-center w-full">
                    <Button
                        onClick={prevCard}
                        disabled={currentCardIdx === 0}
                        variant="outline"
                        className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2 px-4 md:px-6 z-10"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <Button
                        onClick={nextCard}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-4 md:px-6 z-10"
                    >
                        {currentCardIdx < flashcards.length - 1 ? "Next" : "Finish"}
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </div>
        );
    }

    // Upload Screen
    return (
        <div className="w-full max-w-2xl mx-auto space-y-8">
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group",
                    isDragActive ? "border-indigo-400 bg-indigo-400/10 scale-105" : "border-neutral-700 bg-neutral-900 hover:border-indigo-500 hover:bg-neutral-800"
                )}
            >
                <input {...getInputProps()} />
                <div className="p-3 rounded-full bg-neutral-800 group-hover:bg-indigo-500/20 mb-3 transition-colors">
                    <UploadCloud className="w-8 h-8 text-neutral-400 group-hover:text-indigo-400 transition-colors" />
                </div>
                <p className="text-lg font-medium text-neutral-300 text-center">
                    {isDragActive ? "Drop the document here..." : "Drag & drop your study material (PDF, DOCX, DOC)"}
                </p>
                <p className="text-sm text-neutral-500 mt-2">Maximum file size: 10MB.</p>

                {file && (
                    <div className="mt-6 p-4 bg-indigo-500/20 border border-indigo-500/50 rounded-xl flex items-center gap-3">
                        <BookOpen className="text-indigo-400" />
                        <span className="font-semibold text-indigo-200">{file.name}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-900/50 p-6 rounded-3xl border border-neutral-800 backdrop-blur-sm">
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-neutral-400 ml-1 flex items-center gap-2">
                        <BookOpen size={16} /> Mode {(!file) && "(Disabled w/o Doc)"}
                    </label>
                    <div className="w-full bg-neutral-800 border-neutral-700 text-neutral-400 text-sm rounded-lg px-4 py-2 opacity-50 cursor-not-allowed">
                        Study Flashcards
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-semibold text-neutral-400 ml-1 flex items-center gap-2">
                        <Brain size={16} /> Flashcard Count (Max 100)
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={100}
                        value={numFlashcards}
                        onChange={(e) => setNumFlashcards(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-full bg-neutral-800 border-neutral-700 text-neutral-200 text-sm rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="flex justify-center pt-4 mb-6">
                <Button
                    disabled={!file}
                    onClick={() => handleGenerateFlashcards()}
                    size="lg"
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-base font-bold px-8 py-6 shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none rounded-xl w-full sm:w-auto"
                >
                    <Brain className="mr-2 w-5 h-5" /> Generate Flashcards
                </Button>
            </div>
        </div>
    );
}
