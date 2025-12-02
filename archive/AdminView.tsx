import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import ProviderDetail from "./ProviderDetail";

// Mock data (replace with real API calls)
const kpiData = {
  totalGames: 8,
  totalPlayers: 635000,
  totalFeedbacks: 12700,
  avgPositiveRate: 76,
};

const playersByGame = [
  { name: "Mythic Quest", players: 120000 },
  { name: "Hero Clash", players: 95000 },
  { name: "Puzzle Land", players: 70000 },
  { name: "Speed Run", players: 52000 },
  { name: "Farm Town", players: 23000 },
];

const positiveTrend = [
  { month: "Jun", rate: 66 },
  { month: "Jul", rate: 68 },
  { month: "Aug", rate: 70 },
  { month: "Sep", rate: 72 },
  { month: "Oct", rate: 74 },
  { month: "Nov", rate: 76 },
];

// 12-month sentiment breakdown (mock data). Each month has positive / neutral / negative counts.
const reviewTrend12 = [
  { month: "Dec", positive: 1200, neutral: 300, negative: 200 },
  { month: "Jan", positive: 1100, neutral: 320, negative: 230 },
  { month: "Feb", positive: 1150, neutral: 280, negative: 210 },
  { month: "Mar", positive: 1250, neutral: 310, negative: 240 },
  { month: "Apr", positive: 1300, neutral: 290, negative: 220 },
  { month: "May", positive: 1400, neutral: 330, negative: 260 },
  { month: "Jun", positive: 1350, neutral: 300, negative: 250 },
  { month: "Jul", positive: 1380, neutral: 340, negative: 270 },
  { month: "Aug", positive: 1420, neutral: 350, negative: 290 },
  { month: "Sep", positive: 1450, neutral: 360, negative: 300 },
  { month: "Oct", positive: 1500, neutral: 370, negative: 310 },
  { month: "Nov", positive: 1550, neutral: 380, negative: 320 },
];

const genreDistribution = [
  { name: "Action", value: 35 },
  { name: "RPG", value: 25 },
  { name: "Casual", value: 20 },
  { name: "Puzzle", value: 12 },
  { name: "Other", value: 8 },
];

const COLORS = ["#4299E1", "#48BB78", "#F6AD55", "#F56565", "#9F7AEA"];

const USER_COMMENTS = [
  {
    id: "c001",
    userId: "u001",
    userName: "alex_g",
    game: "Mythic Quest",
    comment: "Great game! The new update added some awesome features.",
    timestamp: "2025-11-09 14:23",
    sentiment: "positive",
  },
  {
    id: "c002",
    userId: "u002",
    userName: "keiko_chan",
    game: "Hero Clash",
    comment:
      "The matchmaking system needs improvement, waiting times are too long.",
    timestamp: "2025-11-09 12:15",
    sentiment: "negative",
  },
  {
    id: "c003",
    userId: "u007",
    userName: "dragon_warrior",
    game: "Puzzle Land",
    comment: "Interesting puzzle mechanics, but some levels are too difficult.",
    timestamp: "2025-11-08 23:45",
    sentiment: "neutral",
  },
  {
    id: "c004",
    userId: "u009",
    userName: "game_king",
    game: "Speed Run",
    comment: "Amazing graphics and smooth gameplay! Worth every penny.",
    timestamp: "2025-11-08 22:30",
    sentiment: "positive",
  },
  {
    id: "c005",
    userId: "u004",
    userName: "gamer_pro",
    game: "Farm Town",
    comment: "Too many ads in the free version.",
    timestamp: "2025-11-08 20:15",
    sentiment: "negative",
  },
  {
    id: "c006",
    userId: "u001",
    userName: "alex_g",
    game: "Space Warriors",
    comment: "Love the new co-op missions!",
    timestamp: "2025-11-08 19:45",
    sentiment: "positive",
  },
  {
    id: "c007",
    userId: "u010",
    userName: "speed_runner",
    game: "Dragon Tales",
    comment: "The beta version shows promise, but needs more content.",
    timestamp: "2025-11-08 18:20",
    sentiment: "neutral",
  },
  {
    id: "c008",
    userId: "u005",
    userName: "coolPlayer",
    game: "Cyber Knights",
    comment: "Server issues are making the game unplayable right now.",
    timestamp: "2025-11-08 17:10",
    sentiment: "negative",
  },
];

const GAMES = [
  {
    id: "game-001",
    name: "Mythic Quest",
    provider: "Lunar Games",
    genre: "RPG",
    platform: "PC, Mobile",
    releaseDate: "2025-06-15",
    players: 120000,
    revenue: 450000,
    rating: 4.5,
    status: "Live",
  },
  {
    id: "game-002",
    name: "Hero Clash",
    provider: "Tech Giants",
    genre: "Action",
    platform: "Mobile",
    releaseDate: "2025-03-22",
    players: 95000,
    revenue: 380000,
    rating: 4.2,
    status: "Live",
  },
  {
    id: "game-003",
    name: "Puzzle Land",
    provider: "Pixel Paradise",
    genre: "Puzzle",
    platform: "Mobile",
    releaseDate: "2025-08-01",
    players: 70000,
    revenue: 150000,
    rating: 4.7,
    status: "Live",
  },
  {
    id: "game-004",
    name: "Speed Run",
    provider: "GameForge",
    genre: "Racing",
    platform: "PC, Console",
    releaseDate: "2025-02-10",
    players: 52000,
    revenue: 280000,
    rating: 4.1,
    status: "Live",
  },
  {
    id: "game-005",
    name: "Farm Town",
    provider: "Valley Games",
    genre: "Simulation",
    platform: "Mobile",
    releaseDate: "2025-07-20",
    players: 85000,
    revenue: 120000,
    rating: 4.4,
    status: "Live",
  },
  {
    id: "game-006",
    name: "Space Warriors",
    provider: "Nova Entertainment",
    genre: "Action",
    platform: "PC, Console",
    releaseDate: "2025-09-05",
    players: 43000,
    revenue: 190000,
    rating: 4.3,
    status: "Live",
  },
  {
    id: "game-007",
    name: "Dragon Tales",
    provider: "Dragon Studio",
    genre: "Adventure",
    platform: "Mobile",
    releaseDate: "2025-10-15",
    players: 28000,
    revenue: 45000,
    rating: 3.9,
    status: "Beta",
  },
  {
    id: "game-008",
    name: "Cyber Knights",
    provider: "Future Games",
    genre: "RPG",
    platform: "PC",
    releaseDate: "2025-04-30",
    players: 65000,
    revenue: 320000,
    rating: 4.6,
    status: "Live",
  },
];

const PROVIDERS = [
  {
    id: "prov-001",
    name: "Lunar Games",
    contact: "alice@lunar.games",
    country: "VN",
    totalGames: 8,
    status: "Active",
    revenue: 124000,
    games: [
      {
        game: "Mythic Quest",
        platform: "PC, Mobile",
        genre: "RPG",
        total_reviews: 5200,
        positive: 4100,
        neutral: 800,
        negative: 300,
      },
      {
        game: "Space Warriors",
        platform: "PC",
        genre: "Action",
        total_reviews: 3800,
        positive: 2900,
        neutral: 600,
        negative: 300,
      },
      {
        game: "Dragon's Tale",
        platform: "Mobile",
        genre: "RPG",
        total_reviews: 2500,
        positive: 1800,
        neutral: 400,
        negative: 300,
      },
      {
        game: "Cyber Racer",
        platform: "PC, Console",
        genre: "Racing",
        total_reviews: 1800,
        positive: 1200,
        neutral: 400,
        negative: 200,
      },
    ],
  },
  {
    id: "prov-002",
    name: "Apex Studio",
    contact: "biz@apex.studio",
    country: "JP",
    totalGames: 6,
    status: "Active",
    revenue: 85000,
  },
  {
    id: "prov-003",
    name: "PixelCraft",
    contact: "hello@pixelcraft.io",
    country: "US",
    totalGames: 5,
    status: "Active",
    revenue: 92000,
  },
  {
    id: "prov-004",
    name: "GameForge",
    contact: "contact@gameforge.de",
    country: "DE",
    totalGames: 12,
    status: "Active",
    revenue: 156000,
  },
  {
    id: "prov-005",
    name: "Nordic Games",
    contact: "info@nordicgames.se",
    country: "SE",
    totalGames: 4,
    status: "Active",
    revenue: 67000,
  },
  {
    id: "prov-006",
    name: "Sakura Interactive",
    contact: "support@sakura.jp",
    country: "JP",
    totalGames: 7,
    status: "Active",
    revenue: 113000,
  },
  {
    id: "prov-007",
    name: "Dragon Studio",
    contact: "hello@dragon.vn",
    country: "VN",
    totalGames: 3,
    status: "Pending",
    revenue: 0,
  },
  {
    id: "prov-008",
    name: "Tech Giants",
    contact: "dev@techgiants.kr",
    country: "KR",
    totalGames: 9,
    status: "Active",
    revenue: 145000,
  },
  {
    id: "prov-009",
    name: "Indie Collective",
    contact: "hello@indie.us",
    country: "US",
    totalGames: 4,
    status: "Active",
    revenue: 45000,
  },
  {
    id: "prov-010",
    name: "Maple Studios",
    contact: "info@maplestudios.ca",
    country: "CA",
    totalGames: 6,
    status: "Active",
    revenue: 78000,
  },
  {
    id: "prov-011",
    name: "Digital Dreams",
    contact: "contact@digitaldreams.uk",
    country: "UK",
    totalGames: 5,
    status: "Active",
    revenue: 89000,
  },
  {
    id: "prov-012",
    name: "Future Games",
    contact: "support@futuregames.sg",
    country: "SG",
    totalGames: 3,
    status: "Active",
    revenue: 34000,
  },
  {
    id: "prov-013",
    name: "Cloud Nine",
    contact: "info@cloudnine.au",
    country: "AU",
    totalGames: 4,
    status: "Active",
    revenue: 56000,
  },
  {
    id: "prov-014",
    name: "Red Panda",
    contact: "hello@redpanda.cn",
    country: "CN",
    totalGames: 8,
    status: "Active",
    revenue: 167000,
  },
  {
    id: "prov-015",
    name: "Valley Games",
    contact: "dev@valleygames.in",
    country: "IN",
    totalGames: 5,
    status: "Active",
    revenue: 43000,
  },
  {
    id: "prov-016",
    name: "Pixel Paradise",
    contact: "support@pixelparadise.fr",
    country: "FR",
    totalGames: 6,
    status: "Active",
    revenue: 98000,
  },
  {
    id: "prov-017",
    name: "Nova Entertainment",
    contact: "business@nova.br",
    country: "BR",
    totalGames: 4,
    status: "Pending",
    revenue: 0,
  },
  {
    id: "prov-018",
    name: "Arctic Studio",
    contact: "hello@arcticstudio.fi",
    country: "FI",
    totalGames: 3,
    status: "Active",
    revenue: 47000,
  },
  {
    id: "prov-019",
    name: "Desert Games",
    contact: "info@desertgames.ae",
    country: "AE",
    totalGames: 2,
    status: "Active",
    revenue: 23000,
  },
  {
    id: "prov-020",
    name: "Ocean Interactive",
    contact: "dev@ocean.nz",
    country: "NZ",
    totalGames: 3,
    status: "Active",
    revenue: 38000,
  },
];

const USERS = [
  {
    id: "u001",
    name: "alex_g",
    email: "alex@example.com",
    country: "VN",
    spend: 1200,
    lastLogin: "2025-11-08",
    status: "Active",
  },
  {
    id: "u002",
    name: "keiko_chan",
    email: "keiko@example.jp",
    country: "JP",
    spend: 2560,
    lastLogin: "2025-11-06",
    status: "Active",
  },
  {
    id: "u003",
    name: "sam123",
    email: "sam@example.com",
    country: "US",
    spend: 450,
    lastLogin: "2025-11-01",
    status: "Inactive",
  },
  {
    id: "u004",
    name: "gamer_pro",
    email: "pro@games.de",
    country: "DE",
    spend: 3450,
    lastLogin: "2025-11-09",
    status: "Active",
  },
  {
    id: "u005",
    name: "coolPlayer",
    email: "cool@player.uk",
    country: "UK",
    spend: 890,
    lastLogin: "2025-11-07",
    status: "Active",
  },
  {
    id: "u006",
    name: "ninja_star",
    email: "ninja@star.jp",
    country: "JP",
    spend: 1670,
    lastLogin: "2025-11-08",
    status: "Active",
  },
  {
    id: "u007",
    name: "dragon_warrior",
    email: "dragon@warrior.cn",
    country: "CN",
    spend: 4320,
    lastLogin: "2025-11-09",
    status: "Active",
  },
  {
    id: "u008",
    name: "pixel_master",
    email: "pixel@master.kr",
    country: "KR",
    spend: 2890,
    lastLogin: "2025-11-05",
    status: "Inactive",
  },
  {
    id: "u009",
    name: "game_king",
    email: "king@games.us",
    country: "US",
    spend: 5670,
    lastLogin: "2025-11-08",
    status: "Active",
  },
  {
    id: "u010",
    name: "speed_runner",
    email: "speed@runner.ca",
    country: "CA",
    spend: 1230,
    lastLogin: "2025-11-07",
    status: "Active",
  },
];

export default function AdminView() {
  const [activeTab, setActiveTab] = useState(1);
  const [providerQuery, setProviderQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<
    (typeof PROVIDERS)[0] | null
  >(null);

  // Comments state for moderation (copy of mock data so we can modify in-ui)
  const [comments, setComments] = useState(USER_COMMENTS);
  const [commentSearch, setCommentSearch] = useState("");

  const setCommentSentiment = (id: string, sentiment: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, sentiment } : c))
    );
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const removeComment = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  // Filter providers based on search
  const filteredProviders = useMemo(() => {
    if (!providerQuery) return PROVIDERS;
    const query = providerQuery.toLowerCase();
    return PROVIDERS.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.contact.toLowerCase().includes(query) ||
        p.country.toLowerCase().includes(query)
    );
  }, [providerQuery]);

  const filteredComments = useMemo(() => {
    const q = commentSearch.trim().toLowerCase();
    if (!q) return comments;
    return comments.filter(
      (c) =>
        c.userName.toLowerCase().includes(q) ||
        c.comment.toLowerCase().includes(q) ||
        c.game.toLowerCase().includes(q)
    );
  }, [comments, commentSearch]);

  // Top users by spend (top 5)
  const topSpendUsers = useMemo(() => {
    return [...USERS]
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5)
      .map((u) => ({ name: u.name, spend: u.spend }));
  }, []);

  // Top users by number of comments (top 5) — computed from current comments state
  const topCommentedUsers = useMemo(() => {
    const counts: Record<string, number> = {};
    comments.forEach((c) => {
      counts[c.userId] = (counts[c.userId] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([userId, count]) => ({
        userId,
        count,
        name: USERS.find((u) => u.id === userId)?.name || userId,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [comments]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 bg-slate-50 border-b px-6 py-4">
        <div className="flex gap-2">
          {["Overview", "Providers", "Users", "Games"].map((t, i) => (
            <button
              key={t}
              onClick={() => setActiveTab(i + 1)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === i + 1 ? "bg-white shadow" : "text-slate-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </nav>

      <main className="p-6 space-y-6">
        {/* Overview Tab */}
        {activeTab === 1 && (
          <section className="grid grid-cols-12 gap-6">
            {/* KPI Cards */}
            <div className="col-span-12 grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-slate-500">Total Games</div>
                <div className="text-2xl font-semibold">
                  {kpiData.totalGames}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-slate-500">Total Players</div>
                <div className="text-2xl font-semibold">
                  {kpiData.totalPlayers.toLocaleString()}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-slate-500">Total Feedbacks</div>
                <div className="text-2xl font-semibold">
                  {kpiData.totalFeedbacks.toLocaleString()}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-slate-500">Avg Positive Rate</div>
                <div className="text-2xl font-semibold">
                  {kpiData.avgPositiveRate}%
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="col-span-8 bg-white rounded-lg p-4 shadow-sm">
              <div className="mb-2 font-semibold">Players by Game</div>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={playersByGame}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="players" fill="#3182CE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-4 bg-white rounded-lg p-4 shadow-sm">
              <div className="mb-2 font-semibold">Genre Distribution</div>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={genreDistribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={80}
                    >
                      {genreDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Trend review for 12 months */}
            <div className="col-span-12 bg-white rounded-lg p-4 shadow-sm">
              <div className="mb-2 font-semibold">
                12-month review sentiment trend
              </div>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={reviewTrend12}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="positive" fill="#22c55e" name="Positive" />
                    <Bar dataKey="neutral" fill="#f59e0b" name="Neutral" />
                    <Bar dataKey="negative" fill="#ef4444" name="Negative" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {/* Providers Tab */}
        {activeTab === 2 && (
          <section>
            {selectedProvider ? (
              <ProviderDetail
                provider={selectedProvider}
                onClose={() => setSelectedProvider(null)}
              />
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Providers</h2>
                  <div className="flex gap-2">
                    <input
                      value={providerQuery}
                      onChange={(e) => setProviderQuery(e.target.value)}
                      placeholder="Search providers..."
                      className="px-3 py-2 border rounded-md text-sm"
                    />
                    <button className="px-3 py-2 bg-green-600 text-white rounded-md">
                      Add Provider
                    </button>
                  </div>
                </div>

                {/* Provider Analytics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Top 5 Providers by Revenue */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h3 className="text-sm font-semibold mb-4">
                      Top 5 Providers by Revenue
                    </h3>
                    <div style={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={[...PROVIDERS]
                            .sort((a, b) => b.revenue - a.revenue)
                            .slice(0, 5)}
                          layout="vertical"
                        >
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip />
                          <Bar dataKey="revenue" fill="#3182CE" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top 5 Countries by Number of Games */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h3 className="text-sm font-semibold mb-4">
                      Top 5 Countries by Games
                    </h3>
                    <div style={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={Object.entries(
                            PROVIDERS.reduce((acc, p) => {
                              acc[p.country] =
                                (acc[p.country] || 0) + p.totalGames;
                              return acc;
                            }, {} as Record<string, number>)
                          )
                            .map(([country, games]) => ({
                              country,
                              totalGames: games,
                            }))
                            .sort((a, b) => b.totalGames - a.totalGames)
                            .slice(0, 5)}
                          layout="vertical"
                        >
                          <XAxis type="number" />
                          <YAxis dataKey="country" type="category" width={50} />
                          <Tooltip />
                          <Bar dataKey="totalGames" fill="#48BB78" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-slate-500">
                      <tr>
                        <th className="py-2">Provider</th>
                        <th className="py-2">Contact</th>
                        <th className="py-2">Country</th>
                        <th className="py-2">#Games</th>
                        <th className="py-2">Revenue</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProviders.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="py-2 font-medium">{p.name}</td>
                          <td>{p.contact}</td>
                          <td>{p.country}</td>
                          <td>{p.totalGames}</td>
                          <td>${p.revenue.toLocaleString()}</td>
                          <td>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                p.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedProvider(p)}
                                className="text-blue-600 underline text-sm"
                              >
                                View Details
                              </button>
                              <button className="text-red-600 underline text-sm">
                                Suspend
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Users Tab */}
        {activeTab === 3 && (
          <section>
            {/* Top users charts */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-semibold mb-3">
                  Top 5 Users by Spend
                </h3>
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={topSpendUsers} layout="vertical">
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="spend" fill="#3182CE" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-semibold mb-3">
                  Top 5 Users by Comments
                </h3>
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={topCommentedUsers} layout="vertical">
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#F6AD55" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Users</h2>
              <div className="flex gap-2">
                <input
                  placeholder="Search users..."
                  className="px-3 py-2 border rounded-md text-sm"
                />
                <button className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm">
                  Export Data
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="py-2">Username</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Country</th>
                    <th className="py-2">Total Spend</th>
                    <th className="py-2">Last Login</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {USERS.map((user) => (
                    <tr key={user.id} className="border-t">
                      <td className="py-2 font-medium">{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.country}</td>
                      <td>${user.spend.toLocaleString()}</td>
                      <td>{user.lastLogin}</td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="text-blue-600 underline text-sm">
                            View
                          </button>
                          <button
                            className={`underline text-sm ${
                              user.status === "Active"
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {user.status === "Active" ? "Ban" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Games Tab */}
        {activeTab === 4 && (
          <section className="space-y-6">
            {/* Header with search and filters */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Games</h2>
              <div className="flex gap-2">
                <select className="px-3 py-2 border rounded-md text-sm bg-white">
                  <option value="">All Platforms</option>
                  <option value="mobile">Mobile</option>
                  <option value="pc">PC</option>
                  <option value="console">Console</option>
                </select>
                <select className="px-3 py-2 border rounded-md text-sm bg-white">
                  <option value="">All Genres</option>
                  <option value="action">Action</option>
                  <option value="rpg">RPG</option>
                  <option value="puzzle">Puzzle</option>
                  <option value="simulation">Simulation</option>
                </select>
                <input
                  placeholder="Search games..."
                  className="px-3 py-2 border rounded-md text-sm"
                />
              </div>
            </div>

            {/* Game Analytics Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-slate-500">Total Players</div>
                <div className="text-2xl font-semibold">
                  {GAMES.reduce(
                    (sum, game) => sum + game.players,
                    0
                  ).toLocaleString()}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-slate-500">Total Revenue</div>
                <div className="text-2xl font-semibold">
                  $
                  {GAMES.reduce(
                    (sum, game) => sum + game.revenue,
                    0
                  ).toLocaleString()}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-slate-500">Avg Rating</div>
                <div className="text-2xl font-semibold">
                  {(
                    GAMES.reduce((sum, game) => sum + game.rating, 0) /
                    GAMES.length
                  ).toFixed(1)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-slate-500">Active Games</div>
                <div className="text-2xl font-semibold">
                  {GAMES.filter((game) => game.status === "Live").length}
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Genre Distribution */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-semibold mb-4">Players by Genre</h3>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={Object.entries(
                          GAMES.reduce((acc, game) => {
                            acc[game.genre] =
                              (acc[game.genre] || 0) + game.players;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([genre, players]) => ({
                          name: genre,
                          value: players,
                        }))}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={100}
                        label
                      >
                        {GAMES.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue by Platform */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-semibold mb-4">
                  Revenue by Platform
                </h3>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={Object.entries(
                        GAMES.reduce((acc, game) => {
                          game.platform.split(", ").forEach((platform) => {
                            acc[platform] = (acc[platform] || 0) + game.revenue;
                          });
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([platform, revenue]) => ({
                        platform,
                        revenue,
                      }))}
                    >
                      <XAxis dataKey="platform" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#3182CE" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Games Table */}
            <Card className="rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Rating on Account</h2>
                  <div className="flex gap-2">
                    <input
                      value={commentSearch}
                      onChange={(e) => setCommentSearch(e.target.value)}
                      placeholder="Search comments (user, game, text)..."
                      className="px-3 py-2 border rounded-md text-sm"
                    />
                    <button className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm">
                      Export Data
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-slate-500">
                      <tr>
                        <th className="py-2">Game</th>
                        <th className="py-2">Provider</th>
                        <th className="py-2">Genre</th>
                        <th className="py-2">Platform</th>
                        <th className="py-2">Players</th>
                        <th className="py-2">Revenue</th>
                        <th className="py-2">Rating</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {GAMES.map((game) => (
                        <tr key={game.id} className="border-t">
                          <td className="py-2 font-medium">{game.name}</td>
                          <td>{game.provider}</td>
                          <td>{game.genre}</td>
                          <td>{game.platform}</td>
                          <td>{game.players.toLocaleString()}</td>
                          <td>${game.revenue.toLocaleString()}</td>
                          <td>
                            <div className="flex items-center">
                              <span
                                className={
                                  game.rating >= 4.5
                                    ? "text-green-600"
                                    : "text-yellow-600"
                                }
                              >
                                {game.rating}
                              </span>
                              <span className="text-yellow-400 ml-1">★</span>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                game.status === "Live"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {game.status}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  alert(`View details for ${game.name}`)
                                }
                                className="text-blue-600 underline text-sm"
                              >
                                Details
                              </button>
                              <button
                                onClick={() =>
                                  alert(`View analytics for ${game.name}`)
                                }
                                className="text-slate-600 underline text-sm"
                              >
                                Analytics
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Un-mark Review</h2>
                  <div className="flex gap-2">
                    <input
                      value={commentSearch}
                      onChange={(e) => setCommentSearch(e.target.value)}
                      placeholder="Search comments (user, game, text)..."
                      className="px-3 py-2 border rounded-md text-sm"
                    />
                    <button className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm">
                      Export Data
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg p-4 shadow-sm overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-slate-500">
                      <tr>
                        <th className="py-2">Time</th>
                        <th className="py-2">User</th>
                        <th className="py-2">Email</th>
                        <th className="py-2">Game</th>
                        <th className="py-2">Comment</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredComments.map((c) => {
                        const email =
                          USERS.find((u) => u.id === c.userId)?.email || "";
                        return (
                          <tr key={c.id} className="border-t align-top">
                            <td className="py-2 whitespace-nowrap text-xs text-slate-500">
                              {c.timestamp}
                            </td>
                            <td className="py-2 font-medium">{c.userName}</td>
                            <td className="py-2">{email}</td>
                            <td className="py-2">{c.game}</td>
                            <td className="py-2 max-w-xl">{c.comment}</td>

                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    setCommentSentiment(c.id, "positive")
                                  }
                                  title="Mark positive"
                                  className="text-green-600 hover:text-green-800"
                                >
                                  👍
                                </button>
                                <button
                                  onClick={() =>
                                    setCommentSentiment(c.id, "neutral")
                                  }
                                  title="Mark neutral"
                                  className="text-yellow-600 hover:text-yellow-800"
                                >
                                  😐
                                </button>
                                <button
                                  onClick={() =>
                                    setCommentSentiment(c.id, "negative")
                                  }
                                  title="Mark negative"
                                  className="text-red-600 hover:text-red-800"
                                >
                                  👎
                                </button>
                                <button
                                  onClick={() => removeComment(c.id)}
                                  title="Delete comment"
                                  className="text-slate-600 hover:text-slate-800 ml-2"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}
