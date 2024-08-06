import { NextRequest, NextResponse } from "next/server";

import prisma from "../../../../lib/prisma";

export async function GET(request: NextRequest) {
    return NextResponse.json(await prisma.status.findMany());
}
