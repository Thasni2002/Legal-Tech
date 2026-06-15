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

            {/* Page Header */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[#0F172A] font-bold" style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2 }}>
                        {greeting}, Rahul Sharma
                    </h1>
                    <p className="text-[#64748B] mt-1.5" style={{ fontSize: '18px' }}>
                        Senior Advocate
                    </p>
                </div>
                <div className="text-left md:text-right">
                    <p className="text-[#64748B] font-medium" style={{ fontSize: '16px' }}>{currentDate}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((item, index) => {
                    const Icon = item.icon;

                    return (
                        <div
                            key={index}
                            className="bg-white rounded-xl border border-[#E2E8F0] p-5 md:p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                        >
                            <div className="w-11 h-11 md:w-12 md:h-12 bg-[#2563EB] rounded-lg flex items-center justify-center mb-4">
                                <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </div>

                            <p className="text-[#64748B] text-sm md:text-base">
                                {item.title}
                            </p>

                            <h2 className="text-3xl md:text-4xl font-bold mt-2 text-[#0F172A]">
                                {item.value}
                            </h2>
                        </div>
                    );
                })}
            </div>

            {/* Case Overview + Activities */}
            <div className="grid grid-cols-12 gap-6">

                <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 md:p-6">
                    <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-[#0F172A]">
                        Case Overview
                    </h2>

                    <div className="overflow-x-auto -mx-5 md:mx-0">
                        <div className="inline-block min-w-full align-middle px-5 md:px-0">
                            <table className="w-full min-w-[500px]">
                                <thead>
                                    <tr className="border-b border-[#E2E8F0]">
                                        <th className="text-left py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Case No</th>
                                        <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Client</th>
                                        <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Type</th>
                                        <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Court</th>
                                        <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors duration-150">
                                        <td className="py-4 text-sm text-[#0F172A]">CIV/101</td>
                                        <td className="text-sm text-[#1E293B]">Arun Kumar</td>
                                        <td className="text-sm text-[#64748B]">Civil</td>
                                        <td className="text-sm text-[#64748B]">District Court</td>
                                        <td>
                                            <span className="bg-[#2563EB]/10 text-[#2563EB] px-3 py-1 rounded-full text-xs font-medium">
                                                Hearing
                                            </span>
                                        </td>
                                    </tr>

                                    <tr className="hover:bg-[#F8FAFC] transition-colors duration-150">
                                        <td className="py-4 text-sm text-[#0F172A]">CR/202</td>
                                        <td className="text-sm text-[#1E293B]">State Of Kerala</td>
                                        <td className="text-sm text-[#64748B]">Criminal</td>
                                        <td className="text-sm text-[#64748B]">Sessions Court</td>
                                        <td>
                                            <span className="bg-[#16A34A]/10 text-[#16A34A] px-3 py-1 rounded-full text-xs font-medium">
                                                Active
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 md:p-6">
                    <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-[#0F172A]">
                        Recent Activities
                    </h2>

                    <div className="space-y-4 md:space-y-5">
                        <div className="border-l-[3px] border-[#2563EB] pl-4">
                            <h4 className="font-medium text-sm md:text-base text-[#0F172A]">
                                New Case Assigned
                            </h4>
                            <p className="text-xs md:text-sm text-[#64748B]">
                                10 mins ago
                            </p>
                        </div>

                        <div className="border-l-[3px] border-[#D97706] pl-4">
                            <h4 className="font-medium text-sm md:text-base text-[#0F172A]">
                                Hearing Completed
                            </h4>
                            <p className="text-xs md:text-sm text-[#64748B]">
                                1 hour ago
                            </p>
                        </div>

                        <div className="border-l-[3px] border-[#16A34A] pl-4">
                            <h4 className="font-medium text-sm md:text-base text-[#0F172A]">
                                Client Meeting Scheduled
                            </h4>
                            <p className="text-xs md:text-sm text-[#64748B]">
                                Today
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Upcoming Hearings + Documents */}
            <div className="grid grid-cols-12 gap-6">

                <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 md:p-6">
                    <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-[#0F172A]">
                        Upcoming Hearings
                    </h2>

                    <div className="overflow-x-auto -mx-5 md:mx-0">
                        <div className="inline-block min-w-full align-middle px-5 md:px-0">
                            <table className="w-full min-w-[500px]">
                                <thead>
                                    <tr className="border-b border-[#E2E8F0]">
                                        <th className="text-left py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Date</th>
                                        <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Case</th>
                                        <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Court</th>
                                        <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Advocate</th>
                                        <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Time</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors duration-150">
                                        <td className="py-4 text-sm text-[#0F172A] font-medium">10 Jun</td>
                                        <td className="text-sm text-[#1E293B]">Property Dispute</td>
                                        <td className="text-sm text-[#64748B]">District Court</td>
                                        <td className="text-sm text-[#1E293B]">Rahul Sharma</td>
                                        <td className="text-sm text-[#64748B]">10:30 AM</td>
                                    </tr>

                                    <tr className="hover:bg-[#F8FAFC] transition-colors duration-150">
                                        <td className="py-4 text-sm text-[#0F172A] font-medium">12 Jun</td>
                                        <td className="text-sm text-[#1E293B]">Theft Case</td>
                                        <td className="text-sm text-[#64748B]">Sessions Court</td>
                                        <td className="text-sm text-[#1E293B]">Priya Nair</td>
                                        <td className="text-sm text-[#64748B]">11:00 AM</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 md:p-6">
                    <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-[#0F172A]">
                        Recent Documents
                    </h2>

                    <div className="space-y-2 md:space-y-3">
                        {[
                            "Petition_CIV101.pdf",
                            "Affidavit_CR202.pdf",
                            "Evidence_FAM301.pdf",
                            "Agreement_CORP111.pdf",
                        ].map((doc) => (
                            <div
                                key={doc}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-all duration-200 cursor-pointer"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <FileText className="w-5 h-5 text-[#64748B] shrink-0" />
                                    <span className="truncate text-sm text-[#1E293B]">{doc}</span>
                                </div>

                                <button className="font-medium text-sm text-[#2563EB] hover:text-[#1d4ed8] ml-2 shrink-0 transition-colors duration-150">
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