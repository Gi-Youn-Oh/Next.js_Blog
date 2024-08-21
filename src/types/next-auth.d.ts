import NextAuth from "next-auth";

type AuthUser = {
    id: string;
    email: string;
    name: string;

}
declare module "next-auth" {
    interface Session {
        user: AuthUser;
    }
}