import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Input,
  TablePagination,
} from "@/components/ui";
import { useReactTable, getCoreRowModel, getFilteredRowModel, ColumnFiltersState, flexRender } from "@tanstack/react-table";
// @ts-ignore - JavaScript file without type declarations
import { getPaginatedProsjekt, getProsjektById, setLastVisitedProject } from "@/api/endpoints";
import { useUserStore, useProjectStore } from "@/stores/userStore";

export default function ProjectLandingTable() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { setCurrentProject } = useProjectStore();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedPages, setExpandedPages] = useState(false);

  // Mutation for updating last visited project
  const updateLastVisitedMutation = useMutation({
    mutationFn: setLastVisitedProject,
    onError: (error) => {
      console.error("Failed to update last visited project:", error);
    },
  });

  const handleProjectOpen = async (project: any) => {
    try {
      // Fetch full project details and store in global state
      const projectDetails = await getProsjektById(project.id);
      const fullProject = projectDetails.data || projectDetails;

      // Set current project in global store
      setCurrentProject(fullProject);

      // Try to update last visited project (non-blocking)
      try {
        await updateLastVisitedMutation.mutateAsync({
          userId: user?.id,
          projectId: project.id, // Try 'projectId' instead of 'prosjektId'
          visitedAt: new Date().toISOString(),
        });
      } catch (lastVisitedError) {
        console.warn("Failed to update last visited project (non-critical):", lastVisitedError);
      }

      // Navigate to project landing page
      navigate(`/prosjekt/${project.id}`);
    } catch (error) {
      console.error("Failed to open project:", error);

      // At minimum, set the basic project info we have
      setCurrentProject(project);
      navigate(`/prosjekt/${project.id}`);
    }
  };

  // Fetch paginated data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getPaginatedProsjekt(page, pageSize);
        setData(response.data.items);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error("Error fetching paginated data:", error);
      }
    };
    fetchData();
  }, [page, pageSize]);

  const columns = [
    {
      accessorKey: "prosjektnummer",
      header: "Prosjektnummer",
    },
    {
      accessorKey: "navn",
      header: "Prosjektnavn",
    },
    {
      accessorKey: "beskrivelseSnippet",
      header: "Beskrivelse",
      cell: ({ row }: { row: any }) => {
        const text = row.original.beskrivelseSnippet || "";
        return text.length > 20 ? text.slice(0, 20) + "..." : text;
      },
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }: { row: any }) => (
        <button
          className="text-blue-600 hover:text-blue-900 hover:underline font-semibold"
          onClick={() => handleProjectOpen(row.original)}
          disabled={updateLastVisitedMutation.isLoading}
        >
          Åpne
        </button>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  return (
    <section className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-neutral-900 flex-shrink-0">Alle prosjekter</h2>
        <div className="flex items-center gap-1 ml-auto">
          <div className="flex items-center rounded-lg px-2 py-1 w-full max-w-lg bg-white">
            <span className="text-gray-400 mr-2">🔍</span>
            <Input
              type="text"
              placeholder="Søk"
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="flex-1 text-sm focus:outline-none focus:ring-0 placeholder-gray-400"
            />
          </div>
        </div>
      </div>
      <div className="rounded-md overflow-hidden border shadow-md">
        <Table className="min-w-full divide-y divide-neutral-200">
          <TableHeader className="bg-neutral-50 border-b-1 border-neutral-300">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-neutral-900 sm:pl-6">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-neutral-200 bg-white">
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-neutral-50">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-neutral-500 sm:pl-6">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <TablePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        expandedPages={expandedPages}
        onToggleExpandedPages={() => setExpandedPages(!expandedPages)}
      />
    </section>
  );
}
