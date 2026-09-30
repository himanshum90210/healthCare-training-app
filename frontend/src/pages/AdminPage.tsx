import { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { api } from "../services/api";
import { getApiError } from "../services/apiError";

export default function AdminPage() {
  const [result, setResult] = useState("Loading...");

  useEffect(() => {
    api
      .get("/api/admin/ping")
      .then((res) => setResult(JSON.stringify(res.data, null, 2)))
      .catch((err) => setResult(getApiError(err).message));
  }, []);

  return (
    <>
      <PageHeader title="Administration" description="User, department and schedule management will live here." />
      <Card title="Admin API check">
        <pre style={{ margin: 0, overflow: "auto" }}>{result}</pre>
      </Card>
    </>
  );
}