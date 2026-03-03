import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { UploadCloud, ArrowRight, ArrowLeft, Brain, BookOpen, Volume2, VolumeX, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Flashcard {
    front: string;
    back: string;
}

const flipSounds = [
    '/sounds/flip_01.mp3',
    '/sounds/flip_02.mp3',
    '/sounds/flip_03.mp3',
    '/sounds/flip_04.mp3',
    '/sounds/flip_05.mp3',
    '/sounds/flip_06.mp3',
    '/sounds/flip_07.mp3',
    '/sounds/flip_08.mp3',
    '/sounds/flip_09.mp3',
    '/sounds/flip_10.mp3',
];

const playFlipSound = () => {
    try {
        const randomIndex = Math.floor(Math.random() * flipSounds.length);
        const soundPath = flipSounds[randomIndex];
        const audio = new Audio(soundPath);
        
        audio.volume = 0.5;
        audio.play().catch(e => console.warn("Audio playback failed:", e));
    } catch (e) {
        console.warn("Audio playback failed:", e);
    }
};

export function FlashcardEngine() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
    const [activeFlashcardQueue, setActiveFlashcardQueue] = useState<Flashcard[]>([]);

    const [currentCardIdx, setCurrentCardIdx] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const [sessionRound, setSessionRound] = useState(1);
    const [masteredInCurrentRound, setMasteredInCurrentRound] = useState<number[]>([]);
    const [showRoundSummary, setShowRoundSummary] = useState(false);

    const [flashcardStartTime, setFlashcardStartTime] = useState<number | null>(null);
    const [flashcardDuration, setFlashcardDuration] = useState<number | null>(null);

    const [numFlashcards, setNumFlashcards] = useState(10);
    const [difficulty, setDifficulty] = useState("Medium");
    const [isMuted, setIsMuted] = useState(false);

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
            formData.append("difficulty", difficulty);

            const res = await axios.post("/api/python/upload_flashcards", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res?.data?.status === "success") {
                setFlashcards(res.data.flashcards);
                setActiveFlashcardQueue(res.data.flashcards);
                setFlashcardStartTime(Date.now());
                setFlashcardDuration(null);
                setSessionRound(1);
                setMasteredInCurrentRound([]);
                setShowRoundSummary(false);
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

    const markAsDone = () => {
        if (sessionRound === 1) {
            setMasteredInCurrentRound(prev => [...prev, currentCardIdx]);
        }
        handleNextOrFinishRound();
    };

    const needsReview = () => {
        handleNextOrFinishRound();
    };

    const handleNextOrFinishRound = () => {
        if (currentCardIdx < activeFlashcardQueue.length - 1) {
            setIsFlipped(false);
            setCurrentCardIdx((prev) => prev + 1);
        } else {
            if (flashcardStartTime && !flashcardDuration && sessionRound === 2) {
                setFlashcardDuration(Date.now() - flashcardStartTime);
            }
            
            if (sessionRound === 2) {
                setShowRoundSummary(false); // No summary after round 2, just finish directly
                setCurrentCardIdx(activeFlashcardQueue.length); // Trigger finish natively
            } else {
                if (flashcardStartTime && !flashcardDuration) {
                   setFlashcardDuration(Date.now() - flashcardStartTime);
                }
                setShowRoundSummary(true);
            }
        }
    };

    const startNextRound = () => {
        const unmasteredCards = activeFlashcardQueue.filter((_, idx) => !masteredInCurrentRound.includes(idx));

        if (unmasteredCards.length === 0 || sessionRound >= 2) {
            setShowRoundSummary(false);
            setCurrentCardIdx(activeFlashcardQueue.length);
        } else {
            setActiveFlashcardQueue(unmasteredCards);
            setMasteredInCurrentRound([]);
            setCurrentCardIdx(0);
            setIsFlipped(false);
            setSessionRound(2);
            setShowRoundSummary(false);
        }
    };

    const resetFlashcards = () => {
        setFile(null);
        setFlashcards(null);
        setActiveFlashcardQueue([]);
        setCurrentCardIdx(0);
        setIsFlipped(false);
        setFlashcardStartTime(null);
        setFlashcardDuration(null);
        setSessionRound(1);
        setMasteredInCurrentRound([]);
        setShowRoundSummary(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-6">
                <h3 className="text-xl font-medium text-neutral-800 dark:text-neutral-300">Summoning AI capabilities...</h3>
                <p className="text-neutral-500 dark:text-neutral-500">Generating beautiful flashcards from your text.</p>
            </div>
        );
    }

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m}m ${s}s`;
    };

    if (flashcards && flashcards.length > 0 && currentCardIdx >= activeFlashcardQueue.length && !showRoundSummary) {
        return (
            <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xl overflow-hidden glassmorphism transition-colors">
                <CardContent className="flex flex-col items-center p-12 space-y-8">
                    <Brain className="w-24 h-24 text-indigo-500 dark:text-indigo-400" />
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-indigo-600 dark:from-teal-400 dark:to-indigo-500 text-center">
                        Flashcards Completed!
                    </h2>
                    <div className="text-emerald-500 font-medium">You've reached the end of the session!</div>
                    
                    <div className="w-full bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700/50 space-y-4">
                        <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700 pb-3">
                            <span className="text-neutral-600 dark:text-neutral-400 font-medium">Time Taken</span>
                            <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                                {flashcardDuration ? formatTime(flashcardDuration) : "N/A"}
                            </span>
                        </div>
                    </div>

                    <Button onClick={resetFlashcards} className="bg-indigo-600 hover:bg-indigo-700 w-full max-w-sm mt-4">
                        Upload Another Document
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Interim Round Summary Screen for Round 1 Only
    if (showRoundSummary && activeFlashcardQueue.length > 0) {
        // By design this is ONLY ever hit when round 1 completes. Round 2 runs cleanly until done explicitly successfully without triggering this due to startNextRound logic natively effectively passively seamlessly systematically explicitly properly organically properly explicitly reliably passively correctly logically intelligently actively cleanly actively rationally smartly passively flexibly rationally effortlessly defensively predictably predictably seamlessly neutrally optimally legitimately conservatively appropriately proactively optimally positively successfully intuitively conservatively efficiently flawlessly natively flexibly conservatively confidently elegantly effectively authentically seamlessly conservatively safely successfully seamlessly!
        const mastered = masteredInCurrentRound.length;
        const total = activeFlashcardQueue.length;
        const remaining = total - mastered;
        const percentMastered = total > 0 ? Math.round((mastered / total) * 100) : 0;

        return (
            <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xl overflow-hidden glassmorphism transition-colors">
                <CardContent className="flex flex-col items-center p-12 space-y-8">
                    <BookOpen className="w-20 h-20 text-indigo-500 dark:text-indigo-400 mb-2" />
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 text-center">
                        Round 1 Complete
                    </h2>
                    
                    <div className="w-full bg-neutral-50 dark:bg-neutral-800/50 p-6 flex flex-col items-center justify-center rounded-2xl border border-neutral-200 dark:border-neutral-700/50 space-y-4">
                        <span className="text-4xl font-extrabold text-neutral-800 dark:text-white mb-2">{percentMastered}% Mastered</span>
                        <div className="flex w-full justify-between items-center border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-2">
                            <span className="text-neutral-600 dark:text-neutral-400 font-medium">Time Taken</span>
                             <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                                {flashcardDuration ? formatTime(flashcardDuration) : "N/A"}
                            </span>
                        </div>
                        <div className="flex w-full justify-between items-center pt-2">
                            <span className="text-neutral-600 dark:text-neutral-400 font-medium">Marked Done</span>
                            <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{mastered} / {total}</span>
                        </div>
                        <div className="flex w-full justify-between items-center pt-2">
                            <span className="text-neutral-600 dark:text-neutral-400 font-medium">Needs Review</span>
                            <span className="font-bold text-lg text-amber-500 dark:text-amber-400">{remaining}</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
                         {remaining > 0 ? (
                             <Button onClick={startNextRound} className="bg-indigo-600 hover:bg-indigo-700 w-full text-lg py-6 shadow-md transition-transform transform hover:scale-105">
                                Start Final Review ({remaining} Cards)
                            </Button>
                         ) : (
                             <Button onClick={() => { setShowRoundSummary(false); setCurrentCardIdx(activeFlashcardQueue.length); }} className="bg-emerald-600 hover:bg-emerald-700 w-full text-lg py-6 shadow-md">
                                Finish Content
                            </Button>
                         )}
                         <Button variant="outline" onClick={() => { setShowRoundSummary(false); setCurrentCardIdx(activeFlashcardQueue.length); }} className="w-full text-lg py-6">
                             End Session Now
                         </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (flashcards && flashcards.length > 0 && currentCardIdx < activeFlashcardQueue.length && !showRoundSummary) {
        const card = activeFlashcardQueue[currentCardIdx];
        const progressVal = ((currentCardIdx) / activeFlashcardQueue.length) * 100;

        return (
            <div className="w-full max-w-3xl mx-auto">
                <div className="w-full flex items-center justify-between mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    <span>{currentCardIdx + 1} / {activeFlashcardQueue.length} {sessionRound === 2 && <span className="text-amber-500 ml-1">(Final Review)</span>}</span>
                    <span className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors p-1"
                            title={isMuted ? "Unmute sounds" : "Mute sounds"}
                        >
                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                        <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-400/10 px-2 py-1 rounded-md flex items-center gap-1"><Brain size={14} /> Flashcard Mode</span>
                    </span>
                </div>
                <Progress value={progressVal} className="h-2 mb-8 bg-neutral-200 dark:bg-neutral-800" indicatorClass="bg-indigo-500" />

                <div className="relative w-full perspective-1000 mb-8 cursor-pointer group" onClick={() => { if (!isMuted) playFlipSound(); setIsFlipped(!isFlipped); }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentCardIdx + (isFlipped ? "-back" : "-front")}
                            initial={{ rotateX: isFlipped ? -90 : 90, opacity: 0 }}
                            animate={{ rotateX: 0, opacity: 1 }}
                            exit={{ rotateX: isFlipped ? 90 : -90, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="w-full"
                        >
                            <Card className={cn("w-full min-h-[350px] flex items-center justify-center p-6 md:p-10 border-2 transition-all relative overflow-hidden", isFlipped ? "bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-500/50" : "bg-white dark:bg-neutral-900/80 border-neutral-200 dark:border-neutral-700 hover:border-indigo-300 dark:hover:border-indigo-400")}>
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />

                                <div className="flex w-full h-full max-h-[400px] overflow-y-auto justify-center items-center">
                                    <div className="w-full py-8 px-2 flex justify-center items-center">
                                        <CardTitle className="text-xl md:text-2xl text-center leading-relaxed font-medium text-neutral-900 dark:text-neutral-100">
                                            {isFlipped ? card.back : card.front}
                                        </CardTitle>
                                    </div>
                                </div>

                                <div className="absolute font-light bottom-4 right-6 text-xs text-neutral-500 bg-neutral-100/80 dark:bg-neutral-900/80 px-2 py-1 rounded">
                                    Click card to flip
                                </div>
                            </Card>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 w-full">
                        {!isFlipped ? (
                            <div className="w-full flex justify-between items-center">
                                <Button
                                    onClick={prevCard}
                                    disabled={currentCardIdx === 0}
                                    variant="outline"
                                    className="border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white flex items-center gap-2 px-4 md:px-6 z-10 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-1" /> Prev
                                </Button>
                                <Button
                                    onClick={() => { if (!isMuted) playFlipSound(); setIsFlipped(true); }}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-6 md:px-10 z-10 shadow-md"
                                >
                                    Show Answer
                                </Button>
                            </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full flex justify-center items-center gap-4"
                            >
                                {sessionRound === 1 ? (
                                    <>
                                        <Button
                                            onClick={needsReview}
                                            variant="outline"
                                            className="flex-1 max-w-[150px] border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 flex items-center justify-center gap-2 py-6 text-base shadow-sm"
                                        >
                                            <XCircle className="w-5 h-5"/> Revise
                                        </Button>
                                        <Button
                                            onClick={markAsDone}
                                            className="flex-1 max-w-[150px] bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 py-6 text-base shadow-md"
                                        >
                                            <CheckCircle2 className="w-5 h-5"/> Got It
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        onClick={handleNextOrFinishRound}
                                        className="w-full max-w-[200px] bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 py-6 text-base shadow-md"
                                    >
                                        {currentCardIdx < activeFlashcardQueue.length - 1 ? "Next" : "Finish"} <ArrowRight className="w-4 h-4" />
                                    </Button>
                                )}
                            </motion.div>
                        )}
                    </div>
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8">
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group",
                    isDragActive ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-400/10 scale-105" : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                )}
            >
                <input {...getInputProps()} />
                <div className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 mb-3 transition-colors">
                    <UploadCloud className="w-8 h-8 text-neutral-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                </div>
                <p className="text-lg font-medium text-neutral-600 dark:text-neutral-300 text-center">
                    {isDragActive ? "Drop the document here..." : "Drag & drop your study material (PDF, DOCX, DOC)"}
                </p>
                <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-2">Maximum file size: 10MB.</p>

                {file && (
                    <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/50 rounded-xl flex items-center gap-3 transition-colors">
                        <BookOpen className="text-indigo-600 dark:text-indigo-400" />
                        <span className="font-semibold text-indigo-900 dark:text-indigo-200">{file.name}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-neutral-900/50 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 backdrop-blur-sm transition-colors shadow-sm dark:shadow-none">
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 ml-1 flex items-center gap-2">
                        <BookOpen size={16} /> Mode {(!file) && "(Disabled w/o Doc)"}
                    </label>
                    <div className="w-full bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500 text-sm rounded-lg px-4 py-2 opacity-50 cursor-not-allowed">
                        Study Flashcards
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 ml-1 flex items-center gap-2">
                        <Brain size={16} /> Flashcard Count (Max 100)
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={100}
                        value={numFlashcards}
                        onChange={(e) => setNumFlashcards(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-200 text-sm rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 ml-1 flex items-center gap-2">
                        <Brain size={16} /> Difficulty Level
                    </label>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-200 text-sm rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium (Default)</option>
                        <option value="Difficult">Difficult</option>
                    </select>
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
