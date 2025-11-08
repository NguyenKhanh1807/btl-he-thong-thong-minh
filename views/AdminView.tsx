// src/views/AdminView.tsx
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Users2, Shield, Download, Settings } from "lucide-react";
import { ShieldCheck, UserCog } from "lucide-react";

/* ---------------- Types ---------------- */
type Row = {
  id: string;
  game: string;
  text: string;
  sentiment: "positive" | "neutral" | "negative";
  helpful?: number;
  funny?: number;
  playtime?: number;
  flag?: string;
};

const CSV_PATH = "/dataset/admin_flags.csv";

const SENT_TONE: Record<Row["sentiment"], string> = {
  positive: "bg-green-50 text-green-700 ring-1 ring-green-200",
  neutral: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
  negative: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

// giả lập danh sách người dùng
const MOCK_USERS = [
  { id: "user_001", name: "Alice", role: "user" },
  { id: "user_002", name: "Bob", role: "moderator" },
  { id: "user_003", name: "Charlie", role: "admin" },
];

/* ---------------- Reusable Chip ---------------- */
function Chip({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tone}`}
    >
      {children}
    </span>
  );
}

/* ---------------- Highlight helper ---------------- */
function highlight(text: string, q: string) {
  if (!q) return <>{text}</>;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")})`, "ig");
  const parts = String(text).split(re);
  return (
    <>
      {parts.map((p, i) =>
        re.test(p) ? (
          <mark
            key={i}
            className="rounded px-1 bg-amber-100/70 ring-1 ring-amber-200"
          >
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

/* ---------------- Pagination Component ---------------- */
function Pager({
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
}) {
  const go = (p: number) => onPageChange(Math.min(Math.max(1, p), totalPages));
  const windowStart = Math.max(1, page - 2);
  const windowEnd = Math.min(totalPages, windowStart + 4);
  const pages = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, i) => windowStart + i
  );

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-3">
      <div className="text-sm text-muted-foreground">
        Showing{" "}
        <b>{total === 0 ? 0 : (page - 1) * pageSize + 1}</b>–
        <b>{Math.min(page * pageSize, total)}</b> of <b>{total}</b>
      </div>

      <div className="flex items-center gap-2">
        <select
          className="h-9 rounded-xl border px-2 text-sm"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            onClick={() => go(1)}
            className="h-8 px-3 text-xs rounded-xl"
          >
            « First
          </Button>

          <Button
            variant="secondary"
            onClick={() => go(page - 1)}
            className="h-8 px-3 text-xs rounded-xl"
          >
            ‹ Prev
          </Button>

          {pages.map((p) => (
            <button
              key={p}
              onClick={() => go(p)}
              className={`h-8 w-8 rounded-xl border text-sm ${
                p === page ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ))}

          <Button
            variant="secondary"
            onClick={() => go(page + 1)}
            className="h-8 px-3 text-xs rounded-xl"
          >
            Next ›
          </Button>

          <Button
            variant="secondary"
            onClick={() => go(totalPages)}
            className="h-8 px-3 text-xs rounded-xl"
          >
            Last »
          </Button>
        </div>
      </div>
    </div>
  );
}

function RoleChip({ role }: { role: string }) {
    const tones: Record<string, string> = {
      user: "bg-gray-50 text-gray-700 ring-1 ring-gray-200",
      moderator: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
      admin: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
    };
    return <Chip tone={tones[role] || tones.user}>{role}</Chip>;
  }

  function GrantRoles() {
    const [users, setUsers] = useState(MOCK_USERS);

    const toggleRole = (id: string) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                role: u.role === "admin" ? "user" : "admin",
              }
            : u
        )
      );
      alert(`Updated role for ${id}`);
    };
  };

/* ---------------- AdminView ---------------- */
export default function AdminView() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [flagFilter, setFlagFilter] = useState<"all" | "has" | "none">("has");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [users, setUsers] = useState(MOCK_USERS);

  /* Fetch CSV */
  useEffect(() => {
    Papa.parse<Row>(CSV_PATH, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (r) =>
        setRows((r.data as any[]).filter((x) => x?.id && x?.text)),
    });
  }, []);

  useEffect(() => setPage(1), [q, flagFilter, rows, pageSize]);

  /* Filtering logic */
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (flagFilter === "has" && !r.flag) return false;
      if (flagFilter === "none" && r.flag) return false;
      if (!s) return true;
      return (
        r.game?.toLowerCase().includes(s) ||
        r.text?.toLowerCase().includes(s) ||
        r.flag?.toLowerCase().includes(s)
      );
    });
  }, [rows, q, flagFilter]);

  /* Stats */
  const flagsCount = filtered.filter((r) => r.flag && r.flag.length > 0).length;
  const usersApprox = new Set(filtered.map((r) => r.id)).size;

  /* Pagination */
  const queue = filtered.filter((r) => r.flag && r.flag.length > 0);
  const total = queue.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const pageItems = queue.slice(startIdx, endIdx);

  function toggleRole(id: string) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, role: u.role === "admin" ? "user" : "admin" } : u
      )
    );
    alert(`Updated role for ${id}`);
  }

  return (
    <div className="space-y-6">
      {/* --- Stats --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat
          title="Users (approx.)"
          value={String(usersApprox)}
          icon={<Users2 className="h-4 w-4" />}
        />
        <Stat
          title="API Uptime"
          value="99.9%"
          icon={<Shield className="h-4 w-4" />}
        />
        <Stat
          title="Queued Reports"
          value={String(queue.length)}
          icon={<Download className="h-4 w-4" />}
        />
        <Stat
          title="Spam Flags (24h)"
          value={String(flagsCount)}
          icon={<Settings className="h-4 w-4" />}
        />
      </div>

      {/* --- Moderation Queue --- */}
      <Card className="rounded-2xl">
        <CardHeader className="flex items-center justify-between gap-3">
          <CardTitle>Moderation Queue</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search text, game, or flag…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="rounded-xl h-9 w-64"
            />
            <select
              className="h-9 rounded-xl border px-2 text-sm"
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value as any)}
            >
              <option value="has">Has flags</option>
              <option value="all">All</option>
              <option value="none">No flag</option>
            </select>
            <Button
              variant="secondary"
              className="rounded-xl h-9"
              onClick={() => window.open(CSV_PATH, "_blank")}
            >
              Export CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {pageItems.map((r) => (
            <ModRow key={`${r.id}-${r.text.slice(0, 20)}`} r={r} q={q} />
          ))}
          {total === 0 && (
            <div className="text-sm text-muted-foreground">
              No flagged items.
            </div>
          )}

          {total > 0 && (
            <div className="pt-4 border-t mt-4">
              <Pager
                total={total}
                page={page}
                pageSize={pageSize}
                totalPages={totalPages}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl mt-6">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-purple-600" />
            User Role Management
          </CardTitle>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <UserCog className="h-4 w-4" /> Admin can grant or revoke roles
          </div>
        </CardHeader>

        <CardContent>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left font-medium text-slate-500">User ID</th>
                <th className="py-2 text-left font-medium text-slate-500">Name</th>
                <th className="py-2 text-left font-medium text-slate-500">Role</th>
                <th className="py-2 text-left font-medium text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b hover:bg-slate-50 transition-colors"
                >
                  <td className="py-2">{u.id}</td>
                  <td className="py-2">{u.name}</td>
                  <td className="py-2">
                    <RoleChip role={u.role} />
                  </td>
                  <td className="py-2">
                    <Button
                      variant={u.role === "admin" ? "secondary" : "default"}
                      className={`h-8 px-3 text-xs rounded-lg ${
                        u.role === "admin"
                          ? "bg-slate-200 text-slate-800 hover:bg-slate-300"
                          : "bg-purple-600 text-white hover:bg-purple-700"
                      }`}
                      onClick={() => toggleRole(u.id)}
                    >
                      {u.role === "admin" ? "Revoke Admin" : "Grant Admin"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Stat Card ---------------- */
function Stat({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex items-center justify-between py-3">
        <div className="text-sm text-muted-foreground">{title}</div>
        {icon}
      </CardHeader>
      <CardContent className="text-2xl font-semibold">{value}</CardContent>
    </Card>
  );
}

/* ---------------- Moderation Row ---------------- */
function ModRow({ r, q }: { r: Row; q: string }) {
  const [expanded, setExpanded] = useState(false);

  const flags = (r.flag ?? "")
    .split(/[,;]\s*/g)
    .map((x) => x.trim())
    .filter(Boolean);

  const sentimentChip = (
    <Chip tone={SENT_TONE[r.sentiment]}>
      Sentiment: {r.sentiment}
    </Chip>
  );

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-white/60 backdrop-blur-sm hover:shadow-sm transition-shadow">
      <div
        className={`absolute left-0 top-0 h-full w-1 ${
          flags.length ? "bg-red-300" : "bg-slate-200"
        }`}
      />
      <div className="p-3 md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Chip tone="bg-slate-50 text-slate-700 ring-1 ring-slate-200">
              User: {r.id}
            </Chip>
            <Chip tone="bg-blue-50 text-blue-700 ring-1 ring-blue-200">
              {r.game}
            </Chip>
            {sentimentChip}
            {flags.map((f, i) => (
              <Chip key={i} tone="bg-red-50 text-red-700 ring-1 ring-red-200">
                {f}
              </Chip>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs rounded-lg"
              onClick={() => navigator.clipboard.writeText(r.text)}
            >
              Copy
            </Button>
            <Button
              variant="secondary"
              className="h-8 px-3 text-xs rounded-lg"
              onClick={() => alert("Resolved (demo).")}
            >
              Resolve
            </Button>
            <Button
              variant="default"
              className="h-8 px-3 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700"
              onClick={() => alert("Removed (demo).")}
            >
              Remove
            </Button>
          </div>
        </div>

        <div className="mt-2 text-sm leading-6 tracking-tight text-slate-800">
          <p className={expanded ? "" : "line-clamp-3"}>
            {highlight(r.text, q)}
          </p>
          {r.text && r.text.length > 120 && (
            <button
              className="mt-1 text-xs text-slate-500 hover:text-slate-700"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
