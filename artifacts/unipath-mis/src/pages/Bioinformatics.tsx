import { useState, useMemo } from "react";
import { 
  useListProjects,
  useListClients,
  useListServices,
  useUpsertBioinfoRecord,
  getListProjectsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";
import { Search, Filter, Dna, Edit2, Play, CheckCircle2, ChevronRight, Check } from "lucide-react";
import { formatDate } from "@/lib/utils";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
const STATUS_COLORS = ['#94a3b8', '#818cf8', '#60a5fa', '#f59e0b', '#f97316', '#10b981'];

const PIPELINE_STEPS = [
  { name: "Received in Run", progress: 20, color: "bg-slate-300 dark:bg-slate-700" },
  { name: "Started Analysis", progress: 40, color: "bg-blue-400" },
  { name: "Analysis Steps", progress: 60, color: "bg-yellow-500" },
  { name: "Report Generation", progress: 80, color: "bg-orange-500" },
  { name: "Submitted", progress: 100, color: "bg-green-600" }
];

export default function Bioinformatics() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Filters state
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [clientFilter, setClientFilter] = useState("ALL");
  const [serviceHeadFilter, setServiceHeadFilter] = useState("ALL");
  const [runFilter, setRunFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination / API call
  const { data: projectsData, isLoading } = useListProjects({
    search: search || undefined,
    serviceId: serviceFilter !== "ALL" ? parseInt(serviceFilter, 10) : undefined,
    clientId: clientFilter !== "ALL" ? parseInt(clientFilter, 10) : undefined,
    runNo: runFilter || undefined,
    pageSize: 1000
  });
  
  const rawProjects = projectsData?.data || [];
  const projects = rawProjects.filter(p => {
    const val = (p.withAnalysis || "").toLowerCase();
    return val.includes("with") && !val.includes("without");
  });

  const { data: clients = [] } = useListClients();
  const { data: services = [] } = useListServices();

  const upsertBioinfo = useUpsertBioinfoRecord();

  // Update progress dialog state
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [progressStatus, setProgressStatus] = useState("Received in Run");
  const [pipelineStep, setPipelineStep] = useState("");
  const [notes, setNotes] = useState("");

  const handleOpenUpdate = (project: any) => {
    setSelectedProject(project);
    setProgressStatus(project.bioinfoStatus || (project.status === "In Progress" ? "Started Analysis" : "Received in Run"));
    setPipelineStep(project.bioinfoPipelineStep || "");
    setNotes("");
    setIsUpdateOpen(true);
  };

  const handleSaveProgress = async () => {
    if (!selectedProject) return;

    try {
      await upsertBioinfo.mutateAsync({
        projectId: selectedProject.id,
        data: {
          status: progressStatus,
          pipelineStep: pipelineStep || undefined,
          notes: notes || undefined
        }
      });

      await queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      await queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      setIsUpdateOpen(false);
      toast({ title: "Pipeline progress updated successfully!" });
    } catch (err: any) {
      toast({ title: "Failed to update progress", description: err.message });
    }
  };

  const getResolvedBioinfoStatus = (p: any) => {
    return p.bioinfoStatus || (p.status === "In Progress" ? "Started Analysis" : "Pending");
  };

  // Filter list locally for bioinfo status since API returns raw projects
  const filteredProjects = projects.filter(p => {
    if (statusFilter !== "ALL" && getResolvedBioinfoStatus(p) !== statusFilter) return false;
    if (serviceHeadFilter !== "ALL" && p.serviceHead !== serviceHeadFilter) return false;
    return true;
  });

  // Calculate stats & aggregations
  const totalProjects = filteredProjects.length;
  const inProgress = filteredProjects.filter(p => {
    const status = getResolvedBioinfoStatus(p);
    return status && status !== "Submitted" && status !== "Pending";
  }).length;
  const completed = filteredProjects.filter(p => getResolvedBioinfoStatus(p) === "Submitted").length;
  const pending = filteredProjects.filter(p => getResolvedBioinfoStatus(p) === "Pending").length;

  // Run-wise chart data
  const runCounts: Record<string, number> = {};
  filteredProjects.forEach(p => {
    const run = p.runNo || "No Run";
    runCounts[run] = (runCounts[run] || 0) + 1;
  });
  const runChartData = Object.entries(runCounts).map(([name, count]) => ({ name, count }));

  // Service-wise chart data
  const svcCounts: Record<string, number> = {};
  filteredProjects.forEach(p => {
    const svc = p.serviceName || "Unknown Service";
    svcCounts[svc] = (svcCounts[svc] || 0) + 1;
  });
  const svcChartData = Object.entries(svcCounts).map(([name, value]) => ({ name, value }));

  // Institute-wise chart data (top 6 institutes)
  const clientCounts: Record<string, number> = {};
  filteredProjects.forEach(p => {
    const client = p.clientName || "Unknown Institute";
    clientCounts[client] = (clientCounts[client] || 0) + 1;
  });
  const clientChartData = Object.entries(clientCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Dynamic service head options from projects data
  const serviceHeads = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => {
      if (p.serviceHead && p.serviceHead.trim()) {
        set.add(p.serviceHead.trim());
      }
    });
    return Array.from(set).sort();
  }, [projects]);

  // Pipeline status completion chart data
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "Pending": 0,
      "Received in Run": 0,
      "Started Analysis": 0,
      "Analysis Steps": 0,
      "Report Generation": 0,
      "Submitted": 0
    };
    filteredProjects.forEach(p => {
      const status = getResolvedBioinfoStatus(p);
      if (status in counts) {
        counts[status]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredProjects]);

  console.log("Bioinfo Filter Debug:", {
    statusFilter,
    totalProjects: projects.length,
    filteredCount: filteredProjects.length,
    projectStatuses: projects.map(p => ({ code: p.projectCode, status: getResolvedBioinfoStatus(p) }))
  });

  // Get current step details
  const getProgressPercent = (status?: string) => {
    if (!status || status === "Pending") return 0;
    const step = PIPELINE_STEPS.find(s => s.name === status);
    return step ? step.progress : 0;
  };

  const getProgressColor = (status?: string) => {
    if (!status || status === "Pending") return "bg-muted";
    const step = PIPELINE_STEPS.find(s => s.name === status);
    return step ? step.color : "bg-muted";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight inline-flex items-center gap-2">
            <Dna className="w-8 h-8 text-primary" /> Bioinformatics Workflow
          </h1>
          <p className="text-muted-foreground mt-1">Monitor sequencing runs, pipeline progress, and team workloads.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-sm border-none bg-card">
          <CardContent className="p-6">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Active Projects</div>
            <div className="text-3xl font-bold font-mono">{totalProjects}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-card border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Analysis In Progress</div>
            <div className="text-3xl font-bold font-mono text-blue-500">{inProgress}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-card border-l-4 border-l-green-600">
          <CardContent className="p-6">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Completed & Submitted</div>
            <div className="text-3xl font-bold font-mono text-green-600">{completed}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-card border-l-4 border-l-slate-400">
          <CardContent className="p-6">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pending Run Assignment</div>
            <div className="text-3xl font-bold font-mono text-muted-foreground">{pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Run-wise Volume Bar Chart */}
        <Card className="shadow-sm border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Sequencing Run Workloads</CardTitle>
            <CardDescription className="text-xs">Active project workloads per sequencing run</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] pr-4 pt-2">
            {runChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">No run data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={runChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                  <XAxis dataKey="name" stroke="currentColor" tick={{ fill: "currentColor", fontSize: 10 }} />
                  <YAxis stroke="currentColor" tick={{ fill: "currentColor", fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} 
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {runChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Service Distribution Pie Chart (Without Legends) */}
        <Card className="shadow-sm border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Workload by Service Type</CardTitle>
            <CardDescription className="text-xs">Distribution across sequencing services (hover to inspect)</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center pt-2">
            {svcChartData.length === 0 ? (
              <div className="text-muted-foreground">No service data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={svcChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {svcChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} 
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Institute-wise Workloads Bar Chart */}
        <Card className="shadow-sm border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Top Institutes Workloads</CardTitle>
            <CardDescription className="text-xs">Active project workloads per client institute</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] pr-4 pt-2">
            {clientChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">No institute data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="currentColor"
                    tick={{ fill: "currentColor", fontSize: 9 }}
                    tickFormatter={(tick) => tick.length > 15 ? `${tick.substring(0, 12)}...` : tick}
                  />
                  <YAxis stroke="currentColor" tick={{ fill: "currentColor", fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} 
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {clientChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Workflow Completion Progress Pie Chart */}
        <Card className="shadow-sm border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Workflow Progress</CardTitle>
            <CardDescription className="text-xs">Projects by current pipeline stage</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center pt-2">
            {filteredProjects.length === 0 ? (
              <div className="text-muted-foreground">No workflow data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusCounts}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} 
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-none shadow-sm">
        <div className="p-4 border-b bg-muted/10 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by NGS ID or Client..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          
          <div className="w-full sm:w-44">
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="bg-background"><SelectValue placeholder="All Services" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Services</SelectItem>
                {services.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-44">
            <Select value={serviceHeadFilter} onValueChange={setServiceHeadFilter}>
              <SelectTrigger className="bg-background"><SelectValue placeholder="All Service Heads" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Service Heads</SelectItem>
                {serviceHeads.map((sh: string) => <SelectItem key={sh} value={sh}>{sh}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-44">
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="bg-background"><SelectValue placeholder="All Clients" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Clients/Institutes</SelectItem>
                {clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-40">
            <Input 
              placeholder="Filter by Run No..." 
              value={runFilter}
              onChange={(e) => setRunFilter(e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="w-full sm:w-44">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-background">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Pipeline Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Pipeline Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Received in Run">Received in Run</SelectItem>
                <SelectItem value="Started Analysis">Started Analysis</SelectItem>
                <SelectItem value="Analysis Steps">Analysis Steps</SelectItem>
                <SelectItem value="Report Generation">Report Generation</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NGS Project ID</TableHead>
                <TableHead>Client / Institute</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Run No</TableHead>
                <TableHead className="w-[300px]">Pipeline Progress</TableHead>
                <TableHead>Stage Details</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12">Loading project workflows...</TableCell></TableRow>
              ) : filteredProjects.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No active bioinformatics workflows found.</TableCell></TableRow>
              ) : (
                filteredProjects.map((p) => {
                  const resolvedStatus = getResolvedBioinfoStatus(p);
                  const percent = getProgressPercent(resolvedStatus);
                  const isSubmitted = resolvedStatus === "Submitted";
                  
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm font-semibold text-primary">{p.projectCode}</TableCell>
                      <TableCell className="truncate max-w-[180px]">{p.clientName || 'N/A'}</TableCell>
                      <TableCell className="truncate max-w-[150px]">
                        <div>
                          {p.serviceName || 'N/A'}
                          {p.serviceHead && (
                            <span className="block text-[10px] text-muted-foreground mt-0.5 font-medium">({p.serviceHead})</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.runNo || <span className="text-muted-foreground">Pending</span>}</TableCell>
                      <TableCell>
                        <div className="space-y-1.5 pr-4">
                          <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                            <span>{resolvedStatus}</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: percent === 100 ? "rgb(22, 163, 74)" : "rgb(59, 130, 246)" }}></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.bioinfoPipelineStep ? (
                          <Badge variant="secondary" className="font-semibold text-xs border border-primary/20 text-primary bg-primary/5 uppercase">{p.bioinfoPipelineStep}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenUpdate(p)}
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="Update pipeline step"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Update Progress Dialog Modal */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Pipeline Progress</DialogTitle>
          </DialogHeader>
          
          {selectedProject && (
            <div className="space-y-4 py-4 text-sm">
              <div className="p-3 bg-muted/40 rounded-lg space-y-1 border border-border/40">
                <div className="flex justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Project:</span>
                  <span className="font-mono font-bold text-primary">{selectedProject.projectCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Service:</span>
                  <span className="font-medium">{selectedProject.serviceName}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Workflow Stage *</Label>
                <Select value={progressStatus} onValueChange={setProgressStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Received in Run">1. Received in Run</SelectItem>
                    <SelectItem value="Started Analysis">2. Started Analysis</SelectItem>
                    <SelectItem value="Analysis Steps">3. Service-Specific Analysis Steps</SelectItem>
                    <SelectItem value="Report Generation">4. Report Generation</SelectItem>
                    <SelectItem value="Submitted">5. Project Submitted / Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Detailed Step / Stage (e.g. Alignment, variant calling, curation)</Label>
                <Input 
                  placeholder="e.g. Alignment - BWA-MEM" 
                  value={pipelineStep}
                  onChange={(e) => setPipelineStep(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Log Notes / Remarks</Label>
                <Textarea 
                  placeholder="Enter details on logs, outputs, or error statuses..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProgress} disabled={upsertBioinfo.isPending} className="gap-2 bg-primary hover:bg-primary/95 text-white">
              {upsertBioinfo.isPending ? "Saving..." : <span className="flex items-center gap-1"><Check className="w-4 h-4" /> Save Pipeline Progress</span>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
