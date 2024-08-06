"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ThemeSelectionDropdown } from "@/components/ui/theme-selection-dropdown";
import {
    Application,
    Company,
    Stage,
    Status,
    StatusHistory,
} from "@prisma/client";
import HeatMap from "@uiw/react-heat-map";
import { format } from "date-fns";
import {
    File,
    GanttChartSquareIcon,
    Pen,
    PlusCircle,
    Save,
    Trash,
    User,
} from "lucide-react";
import { Calendar as CalendarIcon } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Inter } from "next/font/google";
import Image from "next/image";
import React, {
    ImgHTMLAttributes,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { Chart } from "react-google-charts";
import { useForm } from "react-hook-form";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
});

interface StatusPickerProps {
    applicationId?: number;
    statusId?: number;
    afterAPIRequest?: () => void;
}

type StatusGroup = {
    [stage in Stage]?: Status[];
};
const StatusContext = React.createContext<StatusGroup>({});

function StatusContextProvider({ children }: { children: React.ReactNode }) {
    type StatusGroup = {
        [stage in Stage]?: Status[];
    };
    const [statusGroups, setStatusGroups] = useState<StatusGroup>({});

    useEffect(() => {
        fetchStatusGroups();
    }, []);

    const fetchStatusGroups = async () => {
        const fetchedStatus = await fetch("api/status");
        const fetchedStatusList: Status[] = await fetchedStatus.json();
        const fetchedStatusGroups: StatusGroup = {};
        for (const s of fetchedStatusList) {
            if (s.stage in fetchedStatusGroups) {
                fetchedStatusGroups[s.stage]!.push(s);
            } else {
                fetchedStatusGroups[s.stage] = [s];
            }
        }
        setStatusGroups(fetchedStatusGroups);
    };
    return (
        <StatusContext.Provider value={statusGroups}>
            {children}
        </StatusContext.Provider>
    );
}

function StatusPicker(props: StatusPickerProps) {
    const statusGroups = useContext(StatusContext);
    const updateJobStatus = async (statusId: number) => {
        if (!props.applicationId) {
            return;
        }
        await fetch("api/application", {
            method: "PATCH",
            body: JSON.stringify({
                applicationId: props.applicationId,
                statusId,
            }),
        });
        if (props.afterAPIRequest) {
            props.afterAPIRequest!();
        }
    };

    return (
        <Select
            name="status"
            defaultValue={
                props.statusId ? props.statusId!.toString() : undefined
            }
            onValueChange={async (statusId) =>
                await updateJobStatus(parseInt(statusId))
            }
        >
            <SelectTrigger className="col-span-3">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {Object.entries(statusGroups).map(([stage, statusList]) => (
                    <SelectGroup key={stage.replaceAll("_", " ")}>
                        <SelectLabel>{stage.replaceAll("_", " ")}</SelectLabel>
                        {statusList.map(
                            (status) =>
                                status.id >= (props.statusId ?? 0) && (
                                    <SelectItem
                                        key={status.id}
                                        value={status.id.toString()}
                                    >
                                        {status.name}
                                    </SelectItem>
                                ),
                        )}
                    </SelectGroup>
                ))}
            </SelectContent>
        </Select>
    );
}

function CreateApplicationDialog({
    beforeAPIRequest,
    afterAPIRequest,
}: {
    beforeAPIRequest: () => void;
    afterAPIRequest: () => void;
}) {
    const [open, setOpen] = React.useState(false);
    const form = useForm();
    const [date, setDate] = React.useState<Date>();

    useEffect(() => {
        setDate(new Date());
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newJob = {
            title: formData.get("title"),
            company: formData.get("company"),
            location: formData.get("location"),
            statusId: formData.has("status")
                ? parseInt(formData.get("status") as string)
                : undefined,
            date: date,
        };

        beforeAPIRequest();
        setOpen(false);
        await fetch("api/application", {
            method: "POST",
            body: JSON.stringify(newJob),
        });
        afterAPIRequest();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    New Application
                </Button>
            </DialogTrigger>
            <DialogContent>
                <Form {...form}>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader className="mb-4">
                            <DialogTitle>New Application</DialogTitle>
                            <DialogDescription>
                                Fill in the details below and click Save to
                                create a new application.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="title" className="text-right">
                                    Job Title
                                </Label>
                                <Input name="title" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="company" className="text-right">
                                    Company
                                </Label>
                                <Input name="company" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    htmlFor="location"
                                    className="text-right"
                                >
                                    Location
                                </Label>
                                <Input name="location" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="status" className="text-right">
                                    Status
                                </Label>
                                <StatusPicker />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="date" className="text-right">
                                    Date
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className="col-span-3 flex justify-start"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? (
                                                format(date, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit">
                                <Save className="h-3.5 w-3.5 mr-1" />
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function CalendarChart({
    applications,
}: {
    applications: (Application & { StatusHistory: StatusHistory[] })[];
}) {
    const applicationCounter: Map<string, number> = new Map();

    for (const application of applications) {
        const date =
            application.StatusHistory.length > 0
                ? application.StatusHistory.at(0)!.date!
                : application.date;
        const day = new Date(date).toISOString();
        if (!applicationCounter.has(day)) {
            applicationCounter.set(day, 0);
        }
        applicationCounter.set(day, applicationCounter.get(day)! + 1);
    }

    return (
        <HeatMap
            className="mx-auto"
            width={1200}
            height={200}
            rectSize={20}
            legendCellSize={0}
            value={Array.from(applicationCounter.entries()).map(
                ([date, count]) => ({
                    date: date.split("T")[0].replaceAll("-", "/"),
                    count,
                }),
            )}
            weekLabels={["", "Mon", "", "Wed", "", "Fri", ""]}
            startDate={new Date("2024/01/01")}
            endDate={new Date("2024/12/31")}
            rectProps={{
                rx: 4.0,
            }}
        />
    );
}

function SankeyChart({
    applications,
}: {
    applications: (Application & { StatusHistory: StatusHistory[] })[];
}) {
    const statusGroups = useContext(StatusContext);

    const stageMap: Map<number, string> = new Map();
    Object.entries(statusGroups)
        .flatMap(([_, statusList]) => statusList)
        .forEach(({ id, name }) => stageMap.set(id, name));

    interface Edge {
        u: number;
        v: number;
    }
    const edges: Map<Edge, number> = new Map();
    const totalFrom = new Map<number, number>();
    const totalTo = new Map<number, number>();

    for (const application of applications) {
        console.log(application.StatusHistory);
        for (let i = 0; i < application.StatusHistory.length - 1; i++) {
            const u = application.StatusHistory[i].newStatusId;
            const v = application.StatusHistory[i + 1].newStatusId;
            const edge = { u, v };
            if (!edges.has(edge)) {
                edges.set(edge, 0);
            }
            edges.set(edge, edges.get(edge)! + 1);
            if (!totalFrom.has(u)) {
                totalFrom.set(u, 0);
            }
            totalFrom.set(u, totalFrom.get(u)! + 1);
            if (!totalTo.has(v)) {
                totalTo.set(v, 0);
            }
            totalTo.set(v, totalTo.get(v)! + 1);
        }
        if (application.StatusHistory.length == 1) {
            const u = application.StatusHistory[0].newStatusId;
            if (!totalFrom.has(u)) {
                totalFrom.set(u, 0);
            }
            totalFrom.set(u, totalFrom.get(u)! + 1);
        }
    }

    const chartData: (string | number)[][] = [["From", "To", "Weight"]];
    console.log(edges);
    edges.forEach((w, { u, v }) => {
        chartData.push([
            `${stageMap.get(u)!} (${Math.max(totalFrom.get(u) ?? 0, totalTo.get(u) ?? 0)})`,
            `${stageMap.get(v)!} (${Math.max(totalFrom.get(v) ?? 0, totalTo.get(v) ?? 0)})`,
            w,
        ]);
    });
    console.log(chartData);

    return (
        <div className="w-full h-full min-h-full min-w-full flex">
            <Chart
                className="mt-7"
                chartType="Sankey"
                width="100%"
                height="100%"
                data={chartData}
                options={{
                    sankey: {
                        node: {
                            label: {
                                fontName: inter.style.fontFamily,
                                fontSize: 20,
                            },
                            labelPadding: 30,
                        },
                    },
                }}
            />
        </div>
    );
}

function SankeyDialog({
    applications,
}: {
    applications: (Application & { StatusHistory: StatusHistory[] })[];
}) {
    const [open, setOpen] = React.useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-1">
                    <GanttChartSquareIcon className="h-3.5 w-3.5" />
                    Sankey Chart
                </Button>
            </DialogTrigger>
            <DialogContent className="min-w-[76%] min-h-[50%]">
                <SankeyChart applications={applications} />
            </DialogContent>
        </Dialog>
    );
}

interface ImgWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    fallbackSrc: string;
}

const ImgWithFallback: React.FC<ImgWithFallbackProps> = ({
    src,
    fallbackSrc,
    ...props
}) => {
    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = fallbackSrc;
    };
    return <img src={src} onError={handleError} {...props} />;
};

function ApplicationsCard() {
    const [applications, setApplications] = useState<
        (Application & { StatusHistory: StatusHistory[] } & {
            company: Company;
        })[]
    >([]);
    const [skeletons, setSkeletons] = useState<number>(0);
    const [currentMonthApplicationCount, setCurrentMonthApplicationCount] =
        useState<number>(0);
    const [hideCompleted, setHideCompleted] = useState<boolean>(true);

    const fetchApplications = async () => {
        const fetchedApplications = await (
            await fetch("api/application")
        ).json();
        setApplications(fetchedApplications);
        setCurrentMonthApplicationCount(
            fetchedApplications.filter(
                (application: any) =>
                    new Date(application.date).getTime() -
                        new Date().getTime() >
                    -30 * 24 * 60 * 60 * 1000,
            ).length,
        );
        setSkeletons(0);
    };

    const deleteApplication = async (applicationId: number) => {
        await fetch("api/application", {
            method: "DELETE",
            body: JSON.stringify({ applicationId }),
        });
        fetchApplications();
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    return (
        <div className="container w-full mx-auto">
            <Card className="rounded-xl">
                <CardHeader className="justify-content-center p-4">
                    <h1 className="text-3xl font-bold">Your activity</h1>
                </CardHeader>
                <CardContent className="mb-0">
                    <div className="flex">
                        <span className="text-sm text-muted-foreground">
                            {applications.length} applications
                        </span>
                        <Separator orientation="vertical" className="mx-4" />
                        <span className="text-sm text-muted-foreground">
                            {currentMonthApplicationCount} in the past month
                        </span>
                    </div>
                </CardContent>
                <CardContent>
                    <CalendarChart applications={applications} />
                </CardContent>
                <CardHeader className="justify-content-center p-4">
                    <div className="grid grid-cols-2 gap-4">
                        <h1 className="text-3xl font-bold">
                            Your applications
                        </h1>
                        <div className="flex flex-row gap-2 justify-end">
                            <div className="flex items-center space-x-2 mr-10">
                                <Switch
                                    id="airplane-mode"
                                    checked={hideCompleted}
                                    onCheckedChange={(_) =>
                                        setHideCompleted(!hideCompleted)
                                    }
                                />
                                <Label htmlFor="airplane-mode">
                                    {hideCompleted
                                        ? "Hide completed"
                                        : "Show completed"}
                                </Label>
                            </div>
                            <SankeyDialog applications={applications} />
                            <Button className="gap-1">
                                <File className="h-3.5 w-3.5" />
                                Export CSV
                            </Button>
                            <CreateApplicationDialog
                                beforeAPIRequest={() =>
                                    setSkeletons(skeletons + 1)
                                }
                                afterAPIRequest={() => fetchApplications()}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table className="table-auto">
                        <TableHeader>
                            <TableRow>
                                <TableHead></TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(skeletons)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <Skeleton className="h-10 w-10 rounded-md my-2" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-24 rounded-md my-2.5" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-24 rounded-md" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-24 rounded-md" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-24 rounded-md" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-24 rounded-md" />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {applications.map(
                                (application) =>
                                    (!hideCompleted ||
                                        application.statusId < 9) && (
                                        <TableRow key={application.id}>
                                            <TableCell className="flex items-center my-2 mx-0">
                                                <ImgWithFallback
                                                    src={`/logos/${application.companyId}.png`}
                                                    fallbackSrc={`/logos/default.png`}
                                                    alt="company logo"
                                                    className="h-10 w-10 rounded-md"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {application.company.name}
                                            </TableCell>
                                            <TableCell>
                                                {application.title}
                                            </TableCell>
                                            <TableCell>
                                                {application.location}
                                            </TableCell>
                                            <TableCell>
                                                <StatusPicker
                                                    applicationId={
                                                        application.id
                                                    }
                                                    statusId={
                                                        application.statusId
                                                    }
                                                    afterAPIRequest={() =>
                                                        fetchApplications()
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button className="mr-2">
                                                    <Pen className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    onClick={() =>
                                                        deleteApplication(
                                                            application.id,
                                                        )
                                                    }
                                                >
                                                    <Trash className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ),
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function UserDropdown({ user }: { user: string }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <Button size="icon">
                    <User className="h-3.5 w-3.5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>{user}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <span onClick={() => signOut()}>Sign out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function LoggedInHome({ user }: { user: string }) {
    return (
        <StatusContextProvider>
            <div className="w-screen">
                <header className="absolute sticky top-5 z-30 h-14 items-center gap-4 border-b bg-background px-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="columns-1 flex flex-row justify-start container mx-auto">
                            <h1 className="text-4xl font-bold">appliflow</h1>
                        </div>
                        <div className="columns-1 flex flex-row justify-end container mx-auto gap-4">
                            <ThemeSelectionDropdown />
                            <UserDropdown user={user} />
                        </div>
                    </div>
                </header>
                <div className="flex w-full top-10 relative">
                    <ApplicationsCard />
                </div>
            </div>
        </StatusContextProvider>
    );
}

function Hero() {
    return (
        <>
            <div className="relative overflow-hidden py-24 lg:py-32">
                <div
                    aria-hidden="true"
                    className="flex absolute -top-96 start-1/2 transform -translate-x-1/2"
                >
                    <div className="bg-gradient-to-r from-background/50 to-background blur-3xl w-[25rem] h-[44rem] rotate-[-60deg] transform -translate-x-[10rem]" />
                    <div className="bg-gradient-to-tl blur-3xl w-[90rem] h-[50rem] rounded-full origin-top-left -rotate-12 -translate-x-[15rem] from-primary-foreground via-primary-foreground to-background" />
                </div>
                <div className="relative z-10">
                    <div className="container py-10 lg:py-16">
                        <div className="max-w-2xl text-center mx-auto">
                            <div className="mt-5 max-w-2xl">
                                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                                    appliflow
                                </h1>
                            </div>
                            <p className="">
                                Track and visualize your job applications
                            </p>
                            <div className="mt-5 max-w-3xl">
                                <p className="text-xl text-muted-foreground"></p>
                            </div>
                            <div className="mt-8 gap-3 flex justify-center">
                                <Button onClick={() => signIn()}>
                                    Sign in
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function NotLoggedInHome() {
    return (
        <>
            <Hero />
        </>
    );
}

export default function Home() {
    const { data: session } = useSession();
    return session ? (
        <LoggedInHome user={session.user!.email!} />
    ) : (
        <NotLoggedInHome />
    );
}
