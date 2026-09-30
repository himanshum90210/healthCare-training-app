import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { DataTable, type Column } from "../components/ui/DataTable";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { Select } from "../components/ui/Select";
import { useDoctorFilters, useDoctors } from "../features/doctors/useDoctors";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { getApiError } from "../services/apiError";
import type { Doctor } from "../types/doctor";
import { initials } from "../utils/format";

const PAGE_SIZE = 10;

const columns: Column<Doctor>[] = [
  {
    key: "name",
    header: "Doctor",
    sortKey: "lastName",
    render: (d) => (
      <div className="person">
        <span className="avatar" aria-hidden="true">
          {initials(d)}
        </span>
        <strong>
          Dr. {d.firstName} {d.lastName}
        </strong>
      </div>
    ),
  },
  { key: "specialty", header: "Specialty", sortKey: "specialty", render: (d) => d.specialty },
  { key: "department", header: "Department", render: (d) => d.department },
  { key: "experience", header: "Experience", sortKey: "yearsOfExperience", render: (d) => `${d.yearsOfExperience} yrs` },
  {
    key: "status",
    header: "Status",
    render: (d) => <Badge tone={d.isActive ? "success" : "warning"}>{d.isActive ? "Active" : "Inactive"}</Badge>,
  },
];

export default function DoctorsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const page = Math.max(1, Number(params.get("page")) || 1);
  const search = params.get("search") ?? "";
  const specialty = params.get("specialty") ?? "";
  const department = params.get("department") ?? "";
  const sort = params.get("sort") ?? "lastName";
  const order = params.get("order") === "desc" ? "desc" : "asc";

  const update = (changes: Record<string, string | undefined>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true }
    );

  // Type freely, query the server only after a short pause
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  useEffect(() => {
    if (debouncedSearch !== search) update({ search: debouncedSearch || undefined, page: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const filters = useDoctorFilters();
  const doctors = useDoctors({ page, limit: PAGE_SIZE, search, specialty, department, sort, order });

  const onSortChange = (key: string) =>
    update({ sort: key, order: key === sort && order === "asc" ? "desc" : "asc", page: undefined });

  return (
    <>
      <PageHeader title="Doctors" description="Find a doctor by name, specialty or department." />

      <div className="toolbar">
        <div className="field__control search">
          <Search size={16} aria-hidden="true" />
          <input
            className="field__input"
            type="search"
            placeholder="Search doctors..."
            aria-label="Search doctors"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          label="Filter by specialty"
          placeholder="All specialties"
          options={filters.data?.specialties ?? []}
          value={specialty}
          onChange={(v) => update({ specialty: v || undefined, page: undefined })}
        />
        <Select
          label="Filter by department"
          placeholder="All departments"
          options={filters.data?.departments ?? []}
          value={department}
          onChange={(v) => update({ department: v || undefined, page: undefined })}
        />
        {(search || specialty || department) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchInput("");
              setParams({}, { replace: true });
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {doctors.isError ? (
        <Card>
          <div className="alert alert--danger" role="alert">
            <span>{getApiError(doctors.error).message}</span>
          </div>
          <Button variant="secondary" onClick={() => void doctors.refetch()}>
            Try again
          </Button>
        </Card>
      ) : (
        <div className="card">
          <DataTable
            columns={columns}
            rows={doctors.data?.items ?? []}
            getRowId={(d) => d.id}
            loading={doctors.isPending}
            skeletonRows={PAGE_SIZE}
            sort={{ key: sort, order }}
            onSortChange={onSortChange}
            onRowClick={(d) => navigate(`/doctors/${d.id}`)}
            emptyTitle="No doctors found"
          />
          {doctors.data && (
            <Pagination
              page={doctors.data.meta.page}
              totalPages={doctors.data.meta.totalPages}
              total={doctors.data.meta.total}
              limit={doctors.data.meta.limit}
              onPageChange={(p) => update({ page: p > 1 ? String(p) : undefined })}
            />
          )}
        </div>
      )}
    </>
  );
}