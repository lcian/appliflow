import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import prisma from "../../../../lib/prisma";

export async function GET(request: NextRequest) {
    const session = await getServerSession();
    return NextResponse.json(
        await prisma.application.findMany({
            where: { user: session!.user!.email! },
            include: {
                StatusHistory: { orderBy: { date: "asc" } },
                company: true,
            },
            orderBy: { recordDate: "desc" },
        }),
    );
}

export async function POST(request: NextRequest) {
    const { statusId, ...rest } = await request.json();
    const session = await getServerSession();
    let company = await prisma.company.findFirst({
        where: { name: rest.company as string },
    });
    if (!company) {
        company = await prisma.company.create({
            data: {
                name: rest.company,
            },
        });
    }
    const application = await prisma.application.create({
        data: {
            status: { connect: { id: statusId } },
            ...rest,
            user: session!.user!.email!,
            company: { connect: { id: company.id } },
        },
    });
    await prisma.statusHistory.create({
        data: {
            applicationId: application.id,
            date: application.date,
            newStatusId: application.statusId,
        },
    });
    return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
    const session = await getServerSession();
    const data = await request.json();
    await prisma.application.update({
        data: {
            status: {
                connect: {
                    id: data.statusId,
                },
            },
            recordDate: new Date(),
        },
        where: {
            id: data.applicationId,
            user: session!.user!.email!,
        },
    });
    await prisma.statusHistory.create({
        data: {
            applicationId: data.applicationId,
            date: new Date(),
            newStatusId: data.statusId,
        },
    });
    return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
    const session = await getServerSession();
    const data = await request.json();

    await prisma.statusHistory.deleteMany({
        where: {
            applicationId: data.applicationId,
        },
    });
    await prisma.application.deleteMany({
        where: {
            id: data.applicationId,
            user: session!.user!.email!,
        },
    });
    return NextResponse.json({ success: true });
}
