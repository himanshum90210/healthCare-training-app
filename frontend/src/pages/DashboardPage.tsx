import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useAppSelector } from "../app/hooks";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { useHealth } from "../features/system/useHealth";
import { api } from "../services/api";
import { getApiError } from "../services/apiError";
import { formatDateTime, roleLabel } from "../utils/format";

type StatusState = "loading" | "up" | "down" | "unknown";

function StatusRow({ label, state }: { label: string; state: StatusState }) {
  const text = { loading: "Checking...", up: "Operational", down: "Unavailable", unknown: "Unknown" }[state];
  return (
    <div className="status-row">
      <span>{label}</span>
      <span className={`status status--${state}`}>
        <span className="status__dot" aria-hidden="true" />
        {text}
      </span>
    </div>
  );
}

function ApiTester() {
  const [result, setResult] = useState("");
  const callMe = async () => {
    try {
      const res = await api.get("/api/auth/me");
      setResult(JSON.stringify(res.data, null, 2));
    } catch (err) {
      setResult(getApiError(err).message);
    }
  };
  return (
    <Card title="Developer tools (dev builds only)">
      <Button variant="secondary" onClick={callMe}>
        Call /api/auth/me
      </Button>
      {result && <pre style={{ overflow: "auto" }}>{result}</pre>}
    </Card>
  );
}

export default function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const health = useHealth();

  if (!user) return null;

  const apiState: StatusState = health.isPending ? "loading" : health.isError ? "down" : "up";
  const dbState: StatusState = health.isPending ? "loading" : (health.data?.database ?? "unknown");

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.firstName}`}
        description="Here is an overview of your training workspace."
      />

      <div className="grid grid--2">
        <Card title="Your account">
          <dl className="details">
            <div>
              <dt>Name</dt>
              <dd>
                {user.firstName} {user.lastName}
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>
                <Badge tone="primary">{roleLabel(user.role)}</Badge>
              </dd>
            </div>
            <div>
              <dt>Last sign-in</dt>
              <dd>{formatDateTime(user.lastLoginAt)}</dd>
            </div>
          </dl>
        </Card>

        <Card
          title="System status"
          action={
            <Button
              variant="ghost"
              className="btn--icon btn--sm"
              aria-label="Refresh status"
              icon={<RefreshCw size={16} />}
              onClick={() => void health.refetch()}
            />
          }
        >
          <StatusRow label="API server" state={apiState} />
          <StatusRow label="Database" state={dbState} />
          {health.dataUpdatedAt > 0 && (
            <p style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
              Last checked {new Date(health.dataUpdatedAt).toLocaleTimeString()}
            </p>
          )}
        </Card>
      </div>

      {import.meta.env.DEV && <ApiTester />}
    </>
  );
}