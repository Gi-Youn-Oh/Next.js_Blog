import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
    const token = await getToken({ req });
    // if already logged in, try to access the signin page, redirect to home
    if (token) {
        const url = req.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
}

export const config = {
    matcher: '/signin'
};
