import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Mock Login (Enter anything for admin)",
            credentials: {
                email: { label: "Email", type: "text", placeholder: "admin@quizlift.com" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // ALWAYS login as admin for testing
                return { id: "1", name: "QuizLift Admin", email: "admin@quizlift.com" };
            }
        })
    ],
    secret: "quizlift_secret_key_for_testing"
});

export { handler as GET, handler as POST };
