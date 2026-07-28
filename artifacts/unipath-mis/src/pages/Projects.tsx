import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useListProjects } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Search, Plus, Filter } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";

export default function Projects() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // Load more items to make virtualization meaningful, or use infinite query
  const { data: projectsData, isLoading } = useListProjects({ 
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page: 1,
    pageSize: 100 // Load more for virtualization demo
  });

  const projects = projectsData?.data || [];
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: projects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 53, // Estimated row height
    overscan: 5,
  });

  const hasActiveFilters = Boolean(search || statusFilter !== "ALL" || dateFrom || dateTo);

  const handleReset = () => {
    setSearch("");
    setStatusFilter("ALL");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-[calc(100vh-2rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage laboratory sequencing projects.</p>
        </div>
        <Button onClick={() => setLocation("/projects/new")} className="gap-2">
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      <Card className="border-none shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex flex-col md:flex-row gap-4 items-stretch md:items-center shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by code, client, or service..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background h-9"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="w-full sm:w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background h-9">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-1.5 bg-background border border-input rounded-md px-2.5 h-9 w-full sm:w-auto">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-xs bg-transparent border-none outline-none focus:ring-0 cursor-pointer text-foreground w-full sm:w-28"
              />
            </div>
            
            <div className="flex items-center gap-1.5 bg-background border border-input rounded-md px-2.5 h-9 w-full sm:w-auto">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-xs bg-transparent border-none outline-none focus:ring-0 cursor-pointer text-foreground w-full sm:w-28"
              />
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground">
                Reset
              </Button>
            )}
          </div>
        </div>

        <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1" ref={parentRef}>
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[100px]">Code</TableHead>
                  <TableHead className="w-[200px]">Client</TableHead>
                  <TableHead className="w-[200px]">Service</TableHead>
                  <TableHead className="w-[100px]">Samples</TableHead>
                  <TableHead className="w-[150px]">Total Cost</TableHead>
                  <TableHead className="w-[150px]">Sub. Date</TableHead>
                  <TableHead className="w-[150px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  position: 'relative',
                }}
              >
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded w-16" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded w-32" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded w-24" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded w-8" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded w-16" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded w-20" /></TableCell>
                      <TableCell><div className="h-6 bg-muted animate-pulse rounded-full w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground border-b-0 absolute w-full top-0">
                      No projects found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const project = projects[virtualRow.index];
                    return (
                      <TableRow
                        key={virtualRow.key}
                        className="cursor-pointer group absolute w-full"
                        onClick={() => setLocation(`/projects/${project.id}`)}
                        style={{
                          top: 0,
                          left: 0,
                          transform: `translateY(${virtualRow.start}px)`,
                          height: `${virtualRow.size}px`,
                        }}
                      >
                        <TableCell className="w-[100px] font-mono text-xs font-semibold text-primary truncate">{project.projectCode}</TableCell>
                        <TableCell className="w-[200px] font-medium truncate">{project.clientName}</TableCell>
                        <TableCell className="w-[200px] text-muted-foreground truncate">{project.serviceName}</TableCell>
                        <TableCell className="w-[100px]">{project.noOfSamples}</TableCell>
                        <TableCell className="w-[150px] font-mono text-sm">{formatCurrency(project.totalProjectCost || 0)}</TableCell>
                        <TableCell className="w-[150px] text-muted-foreground truncate">{formatDate(project.labSubmissionDate || project.date)}</TableCell>
                        <TableCell className="w-[150px]">
                          <Badge className={getStatusColor(project.status)} variant="outline">{project.status}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
