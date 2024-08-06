import { faker } from "@faker-js/faker";
import { Application, Stage, Status } from "@prisma/client";
import { parse } from "csv-parse";
import { create } from "domain";
import fs from "fs";

import prisma from "../lib/prisma";

function randomElement<T>(arr: Array<T>): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function capitalize(s: string): string {
    return s
        .split(" ")
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(" ");
}

async function main() {
    const stagesStatusList: Record<string, string[]> = {
        APPLIED: ["Applied", "Applied with referral"],
        SCREEN: ["Phone screen", "Online assessment"],
        INTERVIEW: [
            "Technical interview",
            "Behavioral interview",
            "Hiring manager interview",
        ],
        OFFER: ["Offer"],
        OUTCOME: ["Rejected", "Offer accepted", "Offer refused", "No response"],
    };
    const statusMap: Map<string, number> = new Map();
    for (const stage in stagesStatusList) {
        for (const status of stagesStatusList[stage]) {
            const createdStatus = await prisma.status.create({
                data: {
                    stage: stage as Stage,
                    name: status,
                },
            });
            statusMap.set(createdStatus.name, createdStatus.id);
        }
    }
    console.log("Seeded status");

    const companies: { id: number; name: string; website: string }[] = [];
    await new Promise((resolve, reject) => {
        fs.createReadStream("data/companies_id.csv")
            .pipe(parse({ delimiter: ",", from_line: 2 }))
            .on("data", function (row) {
                companies.push({
                    id: parseInt(row[0]),
                    name: row[1],
                    website: row[2],
                });
            })
            .on("end", resolve)
            .on("error", reject);
    });
    await prisma.company.createMany({
        data: companies.map((company) => ({
            id: company.id,
            name: company.name,
        })),
    });
    console.log("Seeded companies");

    const applications = [];
    const applicationsInitialStatus = [];
    for (let i = 0; i < 30; i++) {
        const company = randomElement(companies);
        const date = faker.date.recent({ days: 180 });
        const status = statusMap.get(randomElement(stagesStatusList.APPLIED))!;
        applications.push({
            user: "cian.lorenzo@gmail.com",
            title: capitalize(
                faker.company.buzzNoun() + " " + faker.person.jobTitle(),
            ),
            companyId: company.id,
            location: faker.location.city(),
            date: date,
            statusId: status,
        });
        applicationsInitialStatus.push({
            applicationId: i + 1,
            date,
            newStatusId: status,
        });
    }

    await prisma.application.createMany({
        data: applications,
    });
    await prisma.statusHistory.createMany({
        data: applicationsInitialStatus,
    });
    console.log("Seeded applications");

    const now = new Date();
    let statusHistoryRecords = [];
    for (let i = 0; i < 20; i++) {
        const newStatusId = statusMap.get(
            randomElement(stagesStatusList[Stage.SCREEN]),
        )!;
        await prisma.application.update({
            data: {
                status: {
                    connect: {
                        id: newStatusId,
                    },
                },
            },
            where: {
                id: i + 1,
            },
        });
        statusHistoryRecords.push({
            applicationId: i + 1,
            date: faker.date.between({
                from: applications[i].date,
                to: now,
            }),
            newStatusId: newStatusId,
        });
    }

    //for (let i = 0; i < 50; i++) {
    //    const newStatusId = statusMap.get(
    //        randomElement(stagesStatusList[Stage.INTERVIEW].slice(0, 1)),
    //    )!;
    //    await prisma.application.update({
    //        data: {
    //            status: {
    //                connect: {
    //                    id: newStatusId,
    //                },
    //            },
    //        },
    //        where: {
    //            id: i + 1,
    //        },
    //    });
    //    statusHistoryRecords.push({
    //        applicationId: i + 1,
    //        date: faker.date.between({
    //            from: statusHistoryRecords[i].date,
    //            to: now,
    //        }),
    //        newStatusId: newStatusId,
    //    });
    //}
    await prisma.statusHistory.createMany({
        data: statusHistoryRecords,
    });

    console.log("Seeded application status history");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
