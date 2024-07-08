import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

export async function checkSession() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json(
            { message: "인증되지 않은 사용자입니다." },
            { status: 401 }
        );
    }
}