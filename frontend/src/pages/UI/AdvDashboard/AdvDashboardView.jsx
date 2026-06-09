"use client";

import {
    Users,
    Briefcase,
    FolderOpen,
    Gavel,
    FileText,
    Bell,
} from "lucide-react";

export default function AdvDashboardView() {
    const hour = new Date().getHours();

    let greeting = "";

    if (hour >= 5 && hour < 12) {
        greeting = "Good Morning";
    } else if (hour >= 12 && hour < 17) {
        greeting = "Good Afternoon";
    } else if (hour >= 17 && hour < 21) {
        greeting = "Good Evening";
    } else {
        greeting = "Good Night";
    }

    const currentDate = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const stats = [
        {
            title: "Total Advocates",
            value: "23",
            icon: Users,
        },
        {
            title: "Active Cases",
            value: "156",
            icon: Briefcase,
        },
        {
            title: "Pending Cases",
            value: "28",
            icon: FolderOpen,
        },
        {
            title: "Upcoming Hearings",
            value: "14",
            icon: Gavel,
        },
    ];

    return (
        <div className="w-full space-y-6 md:space-y-8">

            {/* Header */}
            <div className="bg-gradient-to-r from-black via-gray-900 to-black text-white rounded-3xl shadow-2xl p-6 md:p-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                            {greeting}, Rahul Sharma 
                        </h1>

                        <p className="text-gray-300 text-sm md:text-lg mt-2 md:mt-3">
                            Senior Advocate
                        </p>

                        <p className="text-gray-400 text-xs md:text-sm mt-1">
                            {currentDate}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((item, index) => {
                    const Icon = item.icon;

                    return (
                        <div
                            key={index}
                            className="bg-white rounded-3xl border border-gray-100 p-5 md:p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                        >
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-black rounded-2xl flex items-center justify-center mb-4">
                                <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                            </div>

                            <p className="text-gray-500 text-sm md:text-base">
                                {item.title}
                            </p>

                            <h2 className="text-3xl md:text-4xl font-bold mt-2">
                                {item.value}
                            </h2>
                        </div>
                    );
                })}
            </div>

            {/* Case Overview + Activities */}
            <div className="grid grid-cols-12 gap-6">

                <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-lg p-5 md:p-6">
                    <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
                        Case Overview
                    </h2>

                    <div className="overflow-x-auto -mx-5 md:mx-0">
                        <div className="inline-block min-w-full align-middle px-5 md:px-0">
                            <table className="w-full min-w-[500px]">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 text-sm font-semibold text-gray-600">Case No</th>
                                        <th className="text-left text-sm font-semibold text-gray-600">Client</th>
                                        <th className="text-left text-sm font-semibold text-gray-600">Type</th>
                                        <th className="text-left text-sm font-semibold text-gray-600">Court</th>
                                        <th className="text-left text-sm font-semibold text-gray-600">Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="py-4 text-sm">CIV/101</td>
                                        <td className="text-sm">Arun Kumar</td>
                                        <td className="text-sm">Civil</td>
                                        <td className="text-sm">District Court</td>
                                        <td>
                                            <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-medium">
                                                Hearing
                                            </span>
                                        </td>
                                    </tr>

                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 text-sm">CR/202</td>
                                        <td className="text-sm">State Of Kerala</td>
                                        <td className="text-sm">Criminal</td>
                                        <td className="text-sm">Sessions Court</td>
                                        <td>
                                            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                                                Active
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 bg-white rounded-3xl border border-gray-100 shadow-lg p-5 md:p-6">
                    <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
                        Recent Activities
                    </h2>

                    <div className="space-y-4 md:space-y-5">
                        <div className="border-l-4 border-black pl-4">
                            <h4 className="font-semibold text-sm md:text-base">
                                New Case Assigned
                            </h4>
                            <p className="text-xs md:text-sm text-gray-500">
                                10 mins ago
                            </p>
                        </div>

                        <div className="border-l-4 border-black pl-4">
                            <h4 className="font-semibold text-sm md:text-base">
                                Hearing Completed
                            </h4>
                            <p className="text-xs md:text-sm text-gray-500">
                                1 hour ago
                            </p>
                        </div>

                        <div className="border-l-4 border-black pl-4">
                            <h4 className="font-semibold text-sm md:text-base">
                                Client Meeting Scheduled
                            </h4>
                            <p className="text-xs md:text-sm text-gray-500">
                                Today
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Upcoming Hearings + Documents */}
            <div className="grid grid-cols-12 gap-6">

                <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-lg p-5 md:p-6">
                    <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
                        Upcoming Hearings
                    </h2>

                    <div className="overflow-x-auto -mx-5 md:mx-0">
                        <div className="inline-block min-w-full align-middle px-5 md:px-0">
                            <table className="w-full min-w-[500px]">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 text-sm font-semibold text-gray-600">Date</th>
                                        <th className="text-left text-sm font-semibold text-gray-600">Case</th>
                                        <th className="text-left text-sm font-semibold text-gray-600">Court</th>
                                        <th className="text-left text-sm font-semibold text-gray-600">Advocate</th>
                                        <th className="text-left text-sm font-semibold text-gray-600">Time</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="py-4 text-sm">10 Jun</td>
                                        <td className="text-sm">Property Dispute</td>
                                        <td className="text-sm">District Court</td>
                                        <td className="text-sm">Rahul Sharma</td>
                                        <td className="text-sm">10:30 AM</td>
                                    </tr>

                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 text-sm">12 Jun</td>
                                        <td className="text-sm">Theft Case</td>
                                        <td className="text-sm">Sessions Court</td>
                                        <td className="text-sm">Priya Nair</td>
                                        <td className="text-sm">11:00 AM</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 bg-white rounded-3xl border border-gray-100 shadow-lg p-5 md:p-6">
                    <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
                        Recent Documents
                    </h2>

                    <div className="space-y-3 md:space-y-4">
                        {[
                            "Petition_CIV101.pdf",
                            "Affidavit_CR202.pdf",
                            "Evidence_FAM301.pdf",
                            "Agreement_CORP111.pdf",
                        ].map((doc) => (
                            <div
                                key={doc}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <FileText className="w-5 h-5 text-black shrink-0" />
                                    <span className="truncate text-sm">{doc}</span>
                                </div>

                                <button className="font-semibold text-sm hover:underline ml-2 shrink-0">
                                    View
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

        </div>
    );
}