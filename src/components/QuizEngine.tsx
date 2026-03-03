import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, CheckCircle2, XCircle, Brain, BookOpen, Loader2, ArrowRight, ArrowLeft, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type MCQOption = {
    text: string;
    is_correct: boolean;
};

type MCQ = {
    question: string;
    options: MCQOption[];
    explanation: string;
    type: string;
};

export function QuizEngine() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [quizData, setQuizData] = useState<MCQ[] | null>(null);

    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<number, { selectedIdx: number, isCorrect: boolean }>>({});

    // Timer states
    const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
    const [quizDuration, setQuizDuration] = useState<number | null>(null);
    const [numQuestions, setNumQuestions] = useState(10);
    const [quizType, setQuizType] = useState("mix");
    const [difficulty, setDifficulty] = useState("Medium");

    const defaultStartDate = new Date();
    defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1);
    const [caTopic, setCaTopic] = useState("All");
    const [caLocation, setCaLocation] = useState("India");
    const [caStartDate, setCaStartDate] = useState(defaultStartDate.toISOString().split('T')[0]);
    const [caEndDate, setCaEndDate] = useState(new Date().toISOString().split('T')[0]);

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

    const handleGenerateQuiz = async (isCurrentAffairs: boolean = false) => {
        if (!isCurrentAffairs && !file) return;
        setLoading(true);
        try {
            let res;
            if (isCurrentAffairs) {
                const formData = new FormData();
                formData.append("num_questions", numQuestions.toString());
                formData.append("difficulty", difficulty);
                formData.append("topic", caTopic);
                formData.append("location", caLocation);
                formData.append("start_date", caStartDate);
                formData.append("end_date", caEndDate);
                res = await axios.post("/api/python/generate_current_affairs", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else if (file) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("quiz_type", quizType);
                formData.append("num_questions", numQuestions.toString());
                formData.append("difficulty", difficulty);

                res = await axios.post("/api/python/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            if (res?.data?.status === "success") {
                setQuizData(res.data.quiz);
                setQuizStartTime(Date.now());
                setQuizDuration(null);
            }
        } catch (error: any) {
            console.error("Failed to generate quiz", error);
            const serverError = error.response?.data?.detail;
            if (serverError) {
                alert(`API Error: ${serverError}`);
            } else {
                alert("Error generating quiz. Is the backend running and API key set? Try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (idx: number, isCorrect: boolean) => {
        if (answers[currentQuestionIdx]) return;
        setAnswers((prev) => ({
            ...prev,
            [currentQuestionIdx]: { selectedIdx: idx, isCorrect },
        }));
    };

    const prevQuestion = () => {
        if (currentQuestionIdx > 0) {
            setCurrentQuestionIdx((prev) => prev - 1);
        }
    };

    const nextQuestion = () => {
        if (!quizData) return;
        if (currentQuestionIdx < quizData.length - 1) {
            setCurrentQuestionIdx((prev) => prev + 1);
        } else {
            setCurrentQuestionIdx(quizData.length);
            if (quizStartTime) setQuizDuration(Date.now() - quizStartTime);
        }
    };

    const resetQuiz = () => {
        setFile(null);
        setQuizData(null);
        setCurrentQuestionIdx(0);
        setAnswers({});
        setQuizStartTime(null);
        setQuizDuration(null);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-6">
                <Loader2 className="w-16 h-16 animate-spin text-indigo-500" />
                <h3 className="text-xl font-medium text-neutral-800 dark:text-neutral-300">Summoning AI capabilities...</h3>
                <p className="text-neutral-500 dark:text-neutral-500">Generating contextual MCQs to test your knowledge.</p>
            </div>
        );
    }

    // Quiz completion screen
    if (quizData && currentQuestionIdx >= quizData.length) {
        const finalScore = Object.values(answers).filter((a) => a.isCorrect).length;
        const incorrectCount = quizData.length - finalScore;
        const percentage = ((finalScore / quizData.length) * 100).toFixed(1);

        const formatTime = (ms: number) => {
            const totalSeconds = Math.floor(ms / 1000);
            const m = Math.floor(totalSeconds / 60);
            const s = totalSeconds % 60;
            return `${m}m ${s}s`;
        };

        return (
            <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xl overflow-hidden glassmorphism transition-colors">
                <CardContent className="flex flex-col items-center p-12 space-y-8">
                    <Brain className="w-24 h-24 text-indigo-500 dark:text-indigo-400" />
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-indigo-600 dark:from-teal-400 dark:to-indigo-500">
                        Quiz Completed!
                    </h2>

                    <div className="w-full bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700/50 space-y-4">
                        <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700 pb-3">
                            <span className="text-neutral-600 dark:text-neutral-400 font-medium">Time Taken</span>
                            <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                                {quizDuration ? formatTime(quizDuration) : "N/A"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700 pb-3">
                            <span className="text-neutral-600 dark:text-neutral-400 font-medium">Score Percentage</span>
                            <span className="font-bold text-lg text-neutral-800 dark:text-neutral-200">{percentage}%</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700 pb-3">
                            <span className="text-neutral-600 dark:text-neutral-400 font-medium">Correct Answers</span>
                            <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{finalScore}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-neutral-600 dark:text-neutral-400 font-medium">Incorrect Answers</span>
                            <span className="font-bold text-lg text-red-600 dark:text-red-400">{incorrectCount}</span>
                        </div>
                    </div>

                    <Button onClick={resetQuiz} className="bg-indigo-600 hover:bg-indigo-700 w-full max-w-sm mt-4">
                        Upload Another Document
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Active quiz screen
    if (quizData && currentQuestionIdx < quizData.length) {
        const q = quizData[currentQuestionIdx];
        const progressVal = ((currentQuestionIdx) / quizData.length) * 100;
        const currentAnswer = answers[currentQuestionIdx];
        const showExplanation = !!currentAnswer;
        const selectedOption = currentAnswer?.selectedIdx;

        return (
            <div className="w-full max-w-3xl mx-auto">
                <div className="w-full flex items-center justify-between mb-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    <span>Question {currentQuestionIdx + 1} of {quizData.length}</span>
                    <span className="flex items-center gap-2">
                        {q.type === "in_and_around" ? (
                            <span className="text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-400/10 px-2 py-1 rounded-md flex items-center gap-1"><Brain size={14} /> In & Around</span>
                        ) : (
                            <span className="text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-400/10 px-2 py-1 rounded-md flex items-center gap-1"><BookOpen size={14} /> Text Based</span>
                        )}
                    </span>
                </div>
                <Progress value={progressVal} className="h-2 mb-8 bg-neutral-200 dark:bg-neutral-800" indicatorClass="bg-indigo-500" />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestionIdx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="bg-white/80 dark:bg-neutral-900/50 backdrop-blur-xl border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xl dark:shadow-2xl p-4 md:p-6 relative group overflow-hidden transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
                            <CardTitle className="text-lg md:text-xl leading-relaxed mb-4 font-semibold">
                                {q.question}
                            </CardTitle>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {q.options.map((opt, idx) => {
                                    let buttonStateClass = "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-500";

                                    if (showExplanation) {
                                        if (opt.is_correct) {
                                            buttonStateClass = "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-100";
                                        } else if (idx === selectedOption) {
                                            buttonStateClass = "bg-red-100 dark:bg-red-500/20 border-red-500 text-red-700 dark:text-red-100";
                                        } else {
                                            buttonStateClass = "bg-neutral-100/50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 opacity-50";
                                        }
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            disabled={showExplanation}
                                            onClick={() => handleOptionSelect(idx, opt.is_correct)}
                                            className={cn(
                                                "w-full text-left p-3 rounded-xl border-2 transition-all duration-200 flex items-start gap-2 justify-between group-hover:shadow-md",
                                                buttonStateClass
                                            )}
                                        >
                                            <span className="font-medium text-sm md:text-base">{opt.text}</span>
                                            {showExplanation && opt.is_correct && <CheckCircle2 className="text-emerald-500 w-5 h-5" />}
                                            {showExplanation && !opt.is_correct && idx === selectedOption && <XCircle className="text-red-500 w-5 h-5" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {showExplanation && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="mt-4 p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-100 transition-colors"
                                >
                                    <div className="flex items-center gap-2 mb-2 font-bold text-indigo-600 dark:text-indigo-300 text-sm">
                                        <Brain className="w-4 h-4" /> Learn More:
                                    </div>
                                    <p className="leading-relaxed text-sm">{q.explanation}</p>
                                </motion.div>
                            )}

                            <div className="mt-8 flex justify-between items-center w-full">
                                <Button
                                    onClick={prevQuestion}
                                    disabled={currentQuestionIdx === 0}
                                    variant="outline"
                                    className="border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white flex items-center gap-2 px-4 md:px-6 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-1" /> Previous
                                </Button>
                                <Button
                                    onClick={nextQuestion}
                                    disabled={!showExplanation}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 px-4 md:px-6"
                                >
                                    {currentQuestionIdx < quizData.length - 1 ? "Next" : "View Results"}
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                </AnimatePresence>
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
                    isDragActive ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-400/10 scale-105" : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                )}
            >
                <input {...getInputProps()} />
                <div className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 mb-3 transition-colors">
                    <UploadCloud className="w-8 h-8 text-neutral-400 dark:text-neutral-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
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
                        <BookOpen size={16} /> Quiz Strategy {(!file) && "(Disabled w/o Doc)"}
                    </label>
                    <select
                        value={quizType}
                        disabled={!file}
                        onChange={(e) => setQuizType(e.target.value)}
                        className="w-full bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-200 text-sm rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
                    >
                        <option value="mix">Balanced Mix (Default)</option>
                        <option value="text_based">Strictly Fact-Based</option>
                        <option value="in_and_around">Conceptually "In & Around"</option>
                    </select>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 ml-1 flex items-center gap-2">
                        <Brain size={16} /> Question Count (Max 50)
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={50}
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-full bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-200 text-sm rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 ml-1 flex items-center gap-2">
                        <Brain size={16} /> Difficulty Level
                    </label>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full bg-neutral-800 border-neutral-700 text-neutral-200 text-sm rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium (Default)</option>
                        <option value="Difficult">Difficult</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-900/40 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800/80 backdrop-blur-sm transition-colors shadow-sm dark:shadow-none">
                <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-4 flex items-center gap-2 px-1">
                    <Globe size={16} /> Current Affairs Targeting (For "Current Affairs" button only)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-neutral-500 ml-1">Topic</label>
                        <input
                            type="text"
                            value={caTopic}
                            onChange={(e) => setCaTopic(e.target.value)}
                            placeholder="All"
                            className="w-full bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-200 text-sm rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-neutral-400 dark:placeholder-neutral-600"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-neutral-500 ml-1">Location</label>
                        <input
                            type="text"
                            value={caLocation}
                            onChange={(e) => setCaLocation(e.target.value)}
                            placeholder="India"
                            className="w-full bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-200 text-sm rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-neutral-400 dark:placeholder-neutral-600"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-neutral-500 ml-1">Date Range (Approx)</label>
                        <div className="flex gap-2">
                            <input
                                title="Start Date"
                                type="date"
                                value={caStartDate}
                                onChange={(e) => setCaStartDate(e.target.value)}
                                className="w-full bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-200 text-sm rounded-lg px-2 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all custom-date-input"
                            />
                            <span className="text-neutral-400 dark:text-neutral-500 self-center">to</span>
                            <input
                                title="End Date"
                                type="date"
                                value={caEndDate}
                                onChange={(e) => setCaEndDate(e.target.value)}
                                className="w-full bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-200 text-sm rounded-lg px-2 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all custom-date-input"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 mb-6">
                <Button
                    disabled={!file}
                    onClick={() => handleGenerateQuiz(false)}
                    size="lg"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-base font-bold px-8 py-6 shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none rounded-xl w-full sm:w-auto"
                >
                    <Brain className="mr-2 w-5 h-5" /> Generate Magic Quiz
                </Button>

                <Button
                    onClick={() => handleGenerateQuiz(true)}
                    size="lg"
                    variant="outline"
                    className="border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-neutral-900/80 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200 text-base font-bold px-8 py-6 shadow-md dark:shadow-lg transition-all transform hover:scale-105 rounded-xl w-full sm:w-auto"
                >
                    <Globe className="mr-2 w-5 h-5" /> Quiz on Current Affairs
                </Button>
            </div>
        </div>
    );
}
