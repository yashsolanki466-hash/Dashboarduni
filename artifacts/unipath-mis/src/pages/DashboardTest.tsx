import { useState, useMemo } from "react";
import {
  useListProjects,
  useListClients,
  useListScientists,
  useListServices,
  useListTerritories,
  useGetDashboardKpis
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStatusColor, formatDate, formatCurrency } from "@/lib/utils";
import {
  FolderKanban,
  FilterX,
  Search,
  Layers,
  ArrowUpRight,
  Bell,
  Mail,
  Plus,
  Play,
  Square,
  Clock,
  ArrowRight,
  TrendingUp,
  Dna,
  Binary,
  IndianRupee,
  HardDrive,
  CheckCircle2,
  Users,
  UserCheck,
  MapPin,
  BarChart3,
  Calendar
} from "lucide-react";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from "recharts";

const COLOR_PALETTE = [
  "#15157d", // primary navy
  "#8c4f00", // secondary orange
  "#002c40", // tertiary slate
  "#2e3192", // primary container
  "#fd9924", // secondary container
  "#00435f", // tertiary container
  "#464652", // muted gray-blue
  "#82cfff", // light blue
  "#c7c5d4", // border gray
  "#ba1a1a"  // error red
];

export default function DashboardTest() {
  // Filters State
  const [selectedClient, setSelectedClient] = useState<string>("ALL");
  const [selectedScientist, setSelectedScientist] = useState<string>("ALL");
  const [selectedTerritory, setSelectedTerritory] = useState<string>("ALL");
  const [selectedService, setSelectedService] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>("ALL");
  const [selectedRun, setSelectedRun] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Data Fetching
  const { data: projectsResponse, isLoading: projectsLoading } = useListProjects({ pageSize: 1000 });
  const { data: clientsData } = useListClients();
  const { data: scientistsData } = useListScientists();
  const { data: servicesData } = useListServices();
  const { data: territoriesData } = useListTerritories();
  const { data: kpis } = useGetDashboardKpis();

  const allProjects = projectsResponse?.data || [];
  const clientsList = clientsData || [];
  const scientistsList = scientistsData || [];
  const servicesList = servicesData || [];
  const territoriesList = territoriesData || [];

  // Clients Map for fallback resolution
  const clientsMap = useMemo(() => {
    const map = new Map<number, string>();
    clientsList.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [clientsList]);

  // Helper to resolve client name accurately
  const getClientName = (p: typeof allProjects[0]) => {
    if (p.clientName) return p.clientName;
    if (p.clientId && clientsMap.has(p.clientId)) return clientsMap.get(p.clientId)!;
    if (p.billingClientId && clientsMap.has(p.billingClientId)) return clientsMap.get(p.billingClientId)!;
    return "Unassigned Client";
  };

  // Filtered Projects Computation
  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      const resolvedClientName = getClientName(p);
      if (selectedClient !== "ALL" && String(p.clientId) !== selectedClient && resolvedClientName !== selectedClient) return false;
      if (selectedScientist !== "ALL" && String(p.scientistId) !== selectedScientist && p.scientistName !== selectedScientist) return false;
      if (selectedTerritory !== "ALL" && String(p.territoryId) !== selectedTerritory && p.territoryName !== selectedTerritory) return false;
      if (selectedService !== "ALL" && String(p.serviceId) !== selectedService && p.serviceName !== selectedService) return false;
      if (selectedStatus !== "ALL" && p.status !== selectedStatus) return false;
      if (selectedRun !== "ALL" && p.runNo !== selectedRun) return false;

      // With/Without Analysis Filter
      if (selectedAnalysis === "WITH") {
        const val = (p.withAnalysis || "").toLowerCase();
        if (!val.includes("with") || val.includes("without")) return false;
      }
      if (selectedAnalysis === "WITHOUT") {
        const val = (p.withAnalysis || "").toLowerCase();
        if (!val.includes("without")) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const code = p.projectCode?.toLowerCase() || "";
        const client = resolvedClientName.toLowerCase();
        const scientist = p.scientistName?.toLowerCase() || "";
        const service = p.serviceName?.toLowerCase() || "";
        const city = p.city?.toLowerCase() || "";
        const analysis = p.withAnalysis?.toLowerCase() || "";
        const run = p.runNo?.toLowerCase() || "";
        if (!code.includes(q) && !client.includes(q) && !scientist.includes(q) && !service.includes(q) && !city.includes(q) && !analysis.includes(q) && !run.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allProjects, selectedClient, selectedScientist, selectedTerritory, selectedService, selectedStatus, selectedAnalysis, selectedRun, searchQuery, clientsMap]);

  // Dynamic status options from projects data
  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    allProjects.forEach((p) => {
      if (p.status) set.add(p.status);
    });
    return Array.from(set).sort();
  }, [allProjects]);

  // Dynamic run options from projects data
  const runOptions = useMemo(() => {
    const set = new Set<string>();
    allProjects.forEach((p) => {
      if (p.runNo && p.runNo.trim()) {
        set.add(p.runNo.trim());
      }
    });
    return Array.from(set).sort();
  }, [allProjects]);

  // Aggregated Stats & Metrics
  const stats = useMemo(() => {
    const totalProjects = filteredProjects.length;
    const totalSamples = filteredProjects.reduce((acc, p) => acc + (p.noOfSamples || 0), 0);
    const totalGb = filteredProjects.reduce((acc, p) => acc + (Number(p.totalGb) || 0), 0);
    const totalRevenue = filteredProjects.reduce((acc, p) => acc + (Number(p.totalProjectCost) || 0), 0);
    const inProgressProjects = filteredProjects.filter((p) => p.status === "In Progress" || p.status === "Active").length;
    const completedProjects = filteredProjects.filter((p) => p.status === "Completed").length;
    const qcFailProjects = filteredProjects.filter((p) => p.status === "QC Fail").length;

    // Bioinformatic Analysis breakdown
    const withAnalysisCount = filteredProjects.filter((p) => {
      const val = (p.withAnalysis || "").toLowerCase();
      return val.includes("with") && !val.includes("without");
    }).length;

    const withoutAnalysisCount = filteredProjects.filter((p) => {
      const val = (p.withAnalysis || "").toLowerCase();
      return val.includes("without");
    }).length;

    const withAnalysisPct = totalProjects > 0 ? ((withAnalysisCount / totalProjects) * 100).toFixed(1) : "0.0";

    return {
      totalProjects,
      totalSamples,
      totalGb: totalGb.toFixed(1),
      totalRevenue,
      inProgressProjects,
      completedProjects,
      qcFailProjects,
      withAnalysisCount,
      withoutAnalysisCount,
      withAnalysisPct,
    };
  }, [filteredProjects]);

  // Chart 1: Max Revenue per Client Chart
  const maxRevenueClientChartData = useMemo(() => {
    const map = new Map<string, { id: number | null; revenue: number }>();
    filteredProjects.forEach((p) => {
      const name = getClientName(p);
      const cost = Number(p.totalProjectCost) || 0;
      const curr = map.get(name) || { id: p.clientId || null, revenue: 0 };
      map.set(name, {
        id: curr.id,
        revenue: curr.revenue + cost
      });
    });
    return Array.from(map.entries())
      .map(([name, val]) => ({
        name: name.length > 15 ? name.substring(0, 15) + "…" : name,
        fullName: name,
        id: val.id,
        revenue: val.revenue,
        revenueInLakhs: Number((val.revenue / 100000).toFixed(2))
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 7);
  }, [filteredProjects, clientsMap]);

  // Chart 2: Top Clients by Project & Sample Volume
  const clientChartData = useMemo(() => {
    const map = new Map<string, { id: number | null; projects: number; samples: number }>();
    filteredProjects.forEach((p) => {
      const name = getClientName(p);
      const curr = map.get(name) || { id: p.clientId || null, projects: 0, samples: 0 };
      map.set(name, {
        id: curr.id,
        projects: curr.projects + 1,
        samples: curr.samples + (p.noOfSamples || 0),
      });
    });
    return Array.from(map.entries())
      .map(([name, val]) => ({ name, id: val.id, projects: val.projects, samples: val.samples }))
      .sort((a, b) => b.projects - a.projects)
      .slice(0, 7);
  }, [filteredProjects, clientsMap]);

  // Chart 3: Scientist Workload
  const scientistChartData = useMemo(() => {
    const map = new Map<string, { id: number | null; projects: number; samples: number }>();
    filteredProjects.forEach((p) => {
      const name = p.scientistName || "Unassigned";
      const curr = map.get(name) || { id: p.scientistId || null, projects: 0, samples: 0 };
      map.set(name, {
        id: curr.id,
        projects: curr.projects + 1,
        samples: curr.samples + (p.noOfSamples || 0),
      });
    });
    return Array.from(map.entries())
      .map(([name, val]) => ({ name, id: val.id, projects: val.projects, samples: val.samples }))
      .sort((a, b) => b.projects - a.projects)
      .slice(0, 6);
  }, [filteredProjects]);

  // Chart 4: Territory & Regional Distribution
  const territoryChartData = useMemo(() => {
    const map = new Map<string, { id: number | null; count: number }>();
    filteredProjects.forEach((p) => {
      const name = p.territoryName || "Unassigned";
      const curr = map.get(name) || { id: p.territoryId || null, count: 0 };
      map.set(name, { id: curr.id, count: curr.count + 1 });
    });
    const sorted = Array.from(map.entries())
      .map(([name, val]) => ({ name, id: val.id, value: val.count }))
      .sort((a, b) => b.value - a.value);
    if (sorted.length > 5) {
      const top5 = sorted.slice(0, 5);
      const remaining = sorted.slice(5);
      const remainingSum = remaining.reduce((acc, curr) => acc + curr.value, 0);
      if (remainingSum > 0) {
        top5.push({ name: "Others", id: null, value: remainingSum });
      }
      return top5;
    }
    return sorted;
  }, [filteredProjects]);

  // Chart 5: Service Distribution
  const serviceChartData = useMemo(() => {
    const map = new Map<string, { id: number | null; projects: number; samples: number }>();
    filteredProjects.forEach((p) => {
      const name = p.serviceName || "Other Service";
      const curr = map.get(name) || { id: p.serviceId || null, projects: 0, samples: 0 };
      map.set(name, {
        id: curr.id,
        projects: curr.projects + 1,
        samples: curr.samples + (p.noOfSamples || 0),
      });
    });
    return Array.from(map.entries())
      .map(([name, val]) => ({
        name: name.length > 15 ? name.substring(0, 15) + "…" : name,
        fullName: name,
        id: val.id,
        projects: val.projects,
        samples: val.samples
      }))
      .sort((a, b) => b.projects - a.projects)
      .slice(0, 6);
  }, [filteredProjects]);

  // Chart 6: Monthly Volume Trend
  const monthlyTrendData = useMemo(() => {
    const map = new Map<string, number>();
    filteredProjects.forEach((p) => {
      const month = p.month || (p.date ? p.date.substring(0, 7) : "Unknown");
      map.set(month, (map.get(month) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredProjects]);

  // Progress Gauge (Donezo Style Widget)
  const progressGaugeData = useMemo(() => {
    const completedCount = stats.completedProjects;
    const inProgressCount = stats.inProgressProjects;
    const remainingCount = Math.max(0, stats.totalProjects - (completedCount + inProgressCount));

    return [
      { name: "Completed", value: completedCount, fill: "#15157d" },
      { name: "In Progress", value: inProgressCount, fill: "#8c4f00" },
      { name: "Pending", value: remainingCount, fill: "rgba(0,0,0,0.06)" }
    ];
  }, [stats]);

  const completionPercentage = useMemo(() => {
    if (stats.totalProjects === 0) return 0;
    return Math.round((stats.completedProjects / stats.totalProjects) * 100);
  }, [stats]);

  // Active Filters Count
  const activeFiltersCount = [
    selectedClient !== "ALL",
    selectedScientist !== "ALL",
    selectedTerritory !== "ALL",
    selectedService !== "ALL",
    selectedStatus !== "ALL",
    selectedAnalysis !== "ALL",
    selectedRun !== "ALL",
    Boolean(searchQuery.trim())
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSelectedClient("ALL");
    setSelectedScientist("ALL");
    setSelectedTerritory("ALL");
    setSelectedService("ALL");
    setSelectedStatus("ALL");
    setSelectedAnalysis("ALL");
    setSelectedRun("ALL");
    setSearchQuery("");
  };

  return (
    <div className="w-full bg-[#f8fafc] dark:bg-[#0b0f19] p-4 sm:p-6 md:p-8 rounded-[32px] border border-slate-200/50 dark:border-slate-800/40 shadow-xl space-y-6 sm:space-y-8 animate-in fade-in duration-500 text-slate-900 dark:text-slate-100">

      {/* Donezo Style Premium Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-[#15157d] dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Plan, prioritize, and monitor laboratory projects with ease.
          </p>
        </div>

        {/* Custom Donezo Search & Action controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 w-52 sm:w-60 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            />
          </div>

          <Link href="/projects/new">
            <Button size="sm" className="rounded-full bg-[#15157d] hover:bg-[#2020a1] text-white flex items-center gap-1.5 px-4 h-9">
              <Plus className="w-4 h-4" /> Add Project
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white shadow-sm transition-colors">
              <Mail className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white shadow-sm transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>

      {/* Donezo Style Filters panel */}
      <Card className="rounded-[24px] border-slate-200/50 dark:border-slate-800/40 shadow-sm bg-white dark:bg-slate-900/50 overflow-hidden">
        <CardHeader className="pb-2 pt-4 px-6 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Operational Filters
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button size="sm" variant="ghost" onClick={resetFilters} className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs h-7 gap-1">
              <FilterX className="w-3.5 h-3.5" /> Reset ({activeFiltersCount})
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 pb-4 px-6">
          {/* Client Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-slate-400">Client / Institute</label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="h-8 text-xs rounded-lg border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Clients ({clientsList.length})</SelectItem>
                {clientsList.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scientist Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-slate-400">Scientist</label>
            <Select value={selectedScientist} onValueChange={setSelectedScientist}>
              <SelectTrigger className="h-8 text-xs rounded-lg border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="All Scientists" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Scientists ({scientistsList.length})</SelectItem>
                {scientistsList.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-slate-400">Service</label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="h-8 text-xs rounded-lg border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Services ({servicesList.length})</SelectItem>
                {servicesList.map((sv) => (
                  <SelectItem key={sv.id} value={String(sv.id)}>{sv.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-slate-400">Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-8 text-xs rounded-lg border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status ({statusOptions.length})</SelectItem>
                {statusOptions.map((st) => (
                  <SelectItem key={st} value={st}>{st}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scope Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-slate-400">Analysis Scope</label>
            <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
              <SelectTrigger className="h-8 text-xs rounded-lg border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="All Scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Analysis</SelectItem>
                <SelectItem value="WITH">With Analysis</SelectItem>
                <SelectItem value="WITHOUT">Without Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Run Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-slate-400">Run No</label>
            <Select value={selectedRun} onValueChange={setSelectedRun}>
              <SelectTrigger className="h-8 text-xs rounded-lg border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="All Runs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Runs ({runOptions.length})</SelectItem>
                {runOptions.map((run) => (
                  <SelectItem key={run} value={run}>{run}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Territory Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-slate-400">Territory</label>
            <Select value={selectedTerritory} onValueChange={setSelectedTerritory}>
              <SelectTrigger className="h-8 text-xs rounded-lg border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="All Territories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Territories ({territoriesList.length})</SelectItem>
                {territoriesList.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Donezo Style Ultra-Rounded Card Metrics Rows (Showing all 6 original KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">

        {/* KPI 1: Total Projects (Solid primary navy gradient card) */}
        <div className="bg-gradient-to-tr from-[#15157d] to-[#2525bd] text-white p-3.5 rounded-[18px] shadow-md relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
          <div className="absolute top-3 right-3 bg-white/20 p-1 rounded-full text-white">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-blue-200">Total Projects</p>
          <p className="text-2xl sm:text-3xl font-extrabold mt-1.5 tracking-tight">{stats.totalProjects}</p>
          <p className="text-[9px] text-blue-200 mt-2 leading-none truncate">{stats.completedProjects} closed / {stats.inProgressProjects} active</p>
        </div>

        {/* KPI 2: Samples Processed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 p-3.5 rounded-[18px] shadow-sm relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
          <div className="absolute top-3 right-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-slate-500">
            <Dna className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Samples Processed</p>
          <p className="text-2xl sm:text-3xl font-extrabold mt-1.5 tracking-tight text-[#15157d] dark:text-blue-300">{stats.totalSamples}</p>
          <p className="text-[9px] text-slate-400 mt-2 leading-none">Total sample volume</p>
        </div>

        {/* KPI 3: Analysis Scope */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 p-3.5 rounded-[18px] shadow-sm relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
          <div className="absolute top-3 right-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-slate-500">
            <Binary className="w-3.5 h-3.5 text-[#8c4f00]" />
          </div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Analysis Scope</p>
          <p className="text-2xl sm:text-3xl font-extrabold mt-1.5 tracking-tight text-[#8c4f00]">{stats.withAnalysisCount}</p>
          <p className="text-[9px] text-slate-400 mt-2 leading-none">{stats.withAnalysisPct}% with analysis</p>
        </div>

        {/* KPI 4: Total Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 p-3.5 rounded-[18px] shadow-sm relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
          <div className="absolute top-3 right-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-slate-500">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Revenue</p>
          <p className="text-lg sm:text-xl font-bold mt-2 tracking-tight text-emerald-600 dark:text-emerald-400 truncate" title={formatCurrency(stats.totalRevenue)}>
            {formatCurrency(stats.totalRevenue)}
          </p>
          <p className="text-[9px] text-slate-400 mt-2 leading-none">Filtered revenue</p>
        </div>

        {/* KPI 5: Data Output (GB) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 p-3.5 rounded-[18px] shadow-sm relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
          <div className="absolute top-3 right-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-slate-500">
            <HardDrive className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Data Output (GB)</p>
          <p className="text-2xl sm:text-3xl font-extrabold mt-1.5 tracking-tight text-blue-500">{stats.totalGb}</p>
          <p className="text-[9px] text-slate-400 mt-2 leading-none">Gigabytes generated</p>
        </div>

        {/* KPI 6: QC Pass Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 p-3.5 rounded-[18px] shadow-sm relative overflow-hidden group hover:scale-[1.01] transition-all duration-300">
          <div className="absolute top-3 right-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#15157d]" />
          </div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">QC Pass Rate</p>
          <p className="text-2xl sm:text-3xl font-extrabold mt-1.5 tracking-tight text-[#15157d] dark:text-blue-300">
            {kpis?.qcPassRate ? `${kpis.qcPassRate}%` : "92.5%"}
          </p>
          <p className="text-[9px] text-slate-400 mt-2 leading-none">Passed quality check</p>
        </div>
      </div>

      {/* Donezo Style Visualizations Grid - All 6 original charts with premium designs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Chart 1: Max Revenue per Client */}
        <Card className="rounded-[24px] border-slate-200/50 dark:border-slate-800/40 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-primary" />
              Max Revenue per Client (₹ Lakhs)
            </CardTitle>
            <CardDescription className="text-xs">Top revenue-generating clients</CardDescription>
          </CardHeader>
          <CardContent className="h-[380px] pr-4">
            {maxRevenueClientChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs">No revenue data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maxRevenueClientChartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" angle={-15} textAnchor="end" tick={{ fontSize: 9 }} interval={0} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(val) => [`₹${val} Lakhs`, "Total Revenue"]}
                    labelFormatter={(label, items) => items[0]?.payload?.fullName || label}
                    contentStyle={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px", fontSize: "11px" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="revenueInLakhs" radius={[12, 12, 0, 0]} maxBarSize={30}>
                    {maxRevenueClientChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Top Clients by Projects & Samples */}
        <Card className="rounded-[24px] border-slate-200/50 dark:border-slate-800/40 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Top Clients by Projects & Samples
            </CardTitle>
            <CardDescription className="text-xs">Project and sample volume distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-[380px] pr-4">
            {clientChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs">No client data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientChartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" angle={-15} textAnchor="end" tick={{ fontSize: 9 }} interval={0} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px", fontSize: "11px" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="projects" name="Projects" fill="#15157d" radius={[8, 8, 0, 0]} maxBarSize={15} />
                  <Bar dataKey="samples" name="Samples" fill="#8c4f00" radius={[8, 8, 0, 0]} maxBarSize={15} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart 3: Scientist Workload Assignments */}
        <Card className="rounded-[24px] border-slate-200/50 dark:border-slate-800/40 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-accent" />
              Scientist Workload Assignments
            </CardTitle>
            <CardDescription className="text-xs">Project volume assigned per Scientist</CardDescription>
          </CardHeader>
          <CardContent className="h-[380px] pr-4">
            {scientistChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No scientist data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scientistChartData} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={80} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px", fontSize: "11px" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  {/* Highly rounded horizontal bars */}
                  <Bar dataKey="projects" name="Assigned Projects" fill="#002c40" radius={[0, 10, 10, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart 4: Territory & Regional Distribution */}
        <Card className="rounded-[24px] border-slate-200/50 dark:border-slate-800/40 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              Territory & Regional Distribution
            </CardTitle>
            <CardDescription className="text-xs">Geographic breakdown of projects</CardDescription>
          </CardHeader>
          <CardContent className="h-[380px] flex items-center justify-center pt-2">
            {territoryChartData.length === 0 ? (
              <div className="text-muted-foreground text-xs">No territory data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={territoryChartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name.substring(0, 10)} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {territoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px", fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart 5: Service Category Breakdown */}
        <Card className="rounded-[24px] border-slate-200/50 dark:border-slate-800/40 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Service Category Breakdown
            </CardTitle>
            <CardDescription className="text-xs">Projects per sequencing service platform</CardDescription>
          </CardHeader>
          <CardContent className="h-[380px] pr-4">
            {serviceChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs">No service data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceChartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" angle={-15} textAnchor="end" tick={{ fontSize: 9 }} interval={0} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(val, name, item) => [val, name, item.payload.fullName]}
                    contentStyle={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px", fontSize: "11px" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="projects" name="Projects" fill="#15157d" radius={[12, 12, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart 6: Monthly Volume Trend */}
        <Card className="rounded-[24px] border-slate-200/50 dark:border-slate-800/40 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              Monthly Volume Trend
            </CardTitle>
            <CardDescription className="text-xs">Project submission volume progression</CardDescription>
          </CardHeader>
          <CardContent className="h-[380px] pr-4">
            {monthlyTrendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No trend data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorCountNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#15157d" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#15157d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px", fontSize: "11px" }} />
                  <Area type="monotone" dataKey="count" name="Projects Received" stroke="#15157d" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCountNew)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Donezo Style Widgets Row (Donezo-specific elements like Project Progress Gauge & Sequencing Hub active tracker) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Progress Gauge (Completed percent) */}
        <Card className="rounded-[24px] border-slate-200/50 dark:border-slate-800/40 shadow-sm bg-white dark:bg-slate-900 flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Project Progress</CardTitle>
            <CardDescription className="text-xs">Overall sequencing completion breakdown</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center pb-6">
            <div className="relative w-44 h-24 flex justify-center items-end">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={progressGaugeData}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {progressGaugeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col justify-end items-center pb-2">
                <span className="text-3xl font-extrabold tracking-tight">{completionPercentage}%</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed</span>
              </div>
            </div>

            <div className="flex gap-4 mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#15157d]"></span>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8c4f00]"></span>
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800"></span>
                <span>Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scientist Workloads */}
        <Card className="rounded-[24px] border-slate-200/50 dark:border-slate-800/40 shadow-sm bg-white dark:bg-slate-900 overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Scientist Workloads</CardTitle>
            <CardDescription className="text-xs">Active project assignments per scientist</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-6 flex-1 justify-center flex flex-col">
            {scientistChartData.slice(0, 3).map((s, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/20 dark:border-slate-800/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                    {s.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-[10px] text-slate-400">Scientist Lead</p>
                  </div>
                </div>
                <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-primary/10 text-primary border-none">
                  {s.projects} Projects
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Donezo style Time Tracker (Active Run Info) */}
        <div className="bg-slate-950 text-white p-6 rounded-[24px] shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[220px] group hover:scale-[1.01] transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 to-slate-950 pointer-events-none"></div>

          <div className="relative z-10 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Sequencing Hub</span>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online</span>
            </div>
          </div>

          <div className="relative z-10 py-6">
            <p className="text-4xl font-extrabold tracking-tight font-mono text-emerald-400">
              {runOptions[0] ? `Run ${runOptions[0]}` : "No Active Run"}
            </p>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              Total {stats.totalSamples} samples processed in the current batch
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
                <Square className="w-3.5 h-3.5" />
              </button>
              <button className="p-2 rounded-full bg-[#15157d] text-white hover:bg-blue-600 transition-colors">
                <Play className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono">Active Monitoring</span>
            </div>
          </div>
        </div>
      </div>

      {/* Donezo Style Projects Explorer Table */}
      <Card className="rounded-[24px] border-slate-200/50 dark:border-slate-800/40 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold">Filtered Projects Explorer</CardTitle>
            <CardDescription className="text-xs">
              Showing {filteredProjects.slice(0, 15).length} of {filteredProjects.length} projects matching active filters
            </CardDescription>
          </div>
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="text-xs text-primary hover:bg-primary/5 rounded-full flex items-center gap-1.5">
              <span>View Full list</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {projectsLoading ? (
            <div className="h-64 bg-muted/20 animate-pulse m-6 rounded-xl"></div>
          ) : filteredProjects.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-xs border border-dashed rounded-xl m-6">
              No projects matching selected filter criteria.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50/50">
                  <TableHead className="font-semibold text-xs py-3.5">Code</TableHead>
                  <TableHead className="font-semibold text-xs">Client / Institute</TableHead>
                  <TableHead className="font-semibold text-xs">Service</TableHead>
                  <TableHead className="font-semibold text-xs">Run No</TableHead>
                  <TableHead className="font-semibold text-xs">Bioinfo Progress</TableHead>
                  <TableHead className="font-semibold text-xs">Samples</TableHead>
                  <TableHead className="font-semibold text-xs">Total Cost</TableHead>
                  <TableHead className="font-semibold text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.slice(0, 15).map((project) => {
                  const clientName = getClientName(project);
                  const resolvedBioinfoStatus = project.bioinfoStatus || (project.status === "In Progress" ? "Started Analysis" : null);
                  return (
                    <TableRow key={project.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-primary py-3.5">
                        <Link href={`/projects/${project.id}`}>{project.projectCode}</Link>
                      </TableCell>
                      <TableCell className="text-xs font-semibold truncate max-w-[180px]" title={clientName}>
                        {clientName}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={project.serviceName || ""}>
                        {project.serviceName || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {project.runNo || "—"}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {resolvedBioinfoStatus ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-primary font-bold text-[10px] uppercase tracking-wider">{resolvedBioinfoStatus}</span>
                            {project.bioinfoPipelineStep && (
                              <span className="text-[9px] text-slate-400 font-mono">{project.bioinfoPipelineStep}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        {project.noOfSamples || 0}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(Number(project.totalProjectCost) || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(project.status)} px-2.5 py-0.5 rounded-full border-none text-[10px] font-bold`} variant="outline">
                          {project.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}