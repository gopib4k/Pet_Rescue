import React, { useEffect, useState, useRef, useCallback } from "react";
import { Gift, Search, ChevronDown, ArrowUpDown, Medal, Award, Sparkles, Diamond, Star } from "lucide-react";
import { motion } from "framer-motion";
import { apiService } from "../../services/api";

interface Reward {
  id?: number;
  user?: number;
  username?: string;
  email?: string;
  points?: number;
  badge?: string;
  reason?: string;
}

const BADGE_OPTIONS = ["", "Starter", "Bronze", "Silver", "Gold", "Platinum"];

// Helper object for styling dropdown options
const badgeOptionClasses: Record<string, string> = {
    Starter: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    Bronze: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    Silver: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
    Gold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Platinum: 'bg-sky-100 text-sky-800 dark:bg-sky-800 dark:text-sky-200',
};

const RewardsPage: React.FC = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBadge, setSelectedBadge] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [ordering, setOrdering] = useState<"-points" | "points" | "">("-points");
  const searchDebounceRef = useRef<number | undefined>(undefined);

  const fetchRewards = useCallback(async (opts?: { badge?: string; q?: string; ordering?: string }) => {
    setLoading(true);
    setError("");
    try {
      const params: string[] = [];
      if (opts?.badge) params.push(`badge=${encodeURIComponent(opts.badge)}`);
      if (opts?.q) params.push(`search=${encodeURIComponent(opts.q)}`);
      if (opts?.ordering) params.push(`ordering=${encodeURIComponent(opts.ordering)}`);
      const query = params.length ? `?${params.join("&")}` : "";
      const data = await apiService.request(`/all-rewards/${query}`);
      const normalized = Array.isArray(data) ? data : [data];
      setRewards(normalized);
    } catch (err) {
      console.error("Failed to fetch rewards", err);
      setError("Failed to fetch rewards");
      setRewards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRewards({ badge: selectedBadge, q: search, ordering });
  }, [selectedBadge, ordering, fetchRewards]);

  useEffect(() => {
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = window.setTimeout(() => {
      fetchRewards({ badge: selectedBadge, q: search, ordering });
    }, 450);
    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    };
  }, [search, selectedBadge, ordering, fetchRewards]);

  const handleBadgeChange = (value: string) => setSelectedBadge(value);
  const toggleOrdering = () => setOrdering((prev) => (prev === "-points" ? "points" : "-points"));

  const badgeStyles = (badge?: string) => {
    switch (badge) {
      case "Gold":
        return "bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 dark:from-yellow-500 dark:to-amber-600 dark:text-amber-100";
      case "Silver":
        return "bg-gradient-to-r from-slate-300 to-gray-400 text-slate-800 dark:from-slate-400 dark:to-slate-600 dark:text-slate-100";
      case "Bronze":
        return "bg-gradient-to-r from-amber-600 to-yellow-700 text-white dark:from-amber-700 dark:to-orange-800 dark:text-orange-100";
      case "Platinum":
        return "bg-gradient-to-r from-slate-100 to-sky-200 text-sky-900 dark:from-sky-300 dark:to-cyan-400 dark:text-cyan-900";
      case "Starter":
      default:
        return "bg-light-primary text-light-secondary dark:bg-dark-primary dark:text-dark-neutral";
    }
  };

  const getBadgeIcon = (badge?: string) => {
    switch (badge) {
      case "Gold":
        return <Medal className="w-5 h-5 drop-shadow-sm" />;
      case "Silver":
        return <Award className="w-5 h-5 drop-shadow-sm" />;
      case "Bronze":
        return <Star className="w-5 h-5 drop-shadow-sm" />;
      case "Platinum":
        return <Diamond className="w-5 h-5 drop-shadow-sm" />;
      default:
        return <Sparkles className="w-5 h-5 drop-shadow-sm" />;
    }
  };

  const isPremium = (badge?: string) => badge === "Gold" || badge === "Platinum";

  return (
    <div className="p-6 md:p-10 min-h-[70vh] bg-light-primary dark:bg-dark-background theme-transition">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl shadow-sm border bg-light-neutral dark:bg-dark-primary border-light-secondary/10 dark:border-dark-secondary/20">
            <Gift className="w-8 h-8 text-light-accent dark:text-dark-accent" />
          </div>
          <div>
            <h1 className="text-3xl md:text-3xl font-semibold tracking-tight text-light-text dark:text-dark-secondary">
              Rewards Management
            </h1>
            <p className="text-base text-light-secondary dark:text-dark-neutral mt-1">
              Track points, assign badges, and celebrate top contributors 🎉
            </p>
          </div>
        </div>

        <div className="text-center md:text-right">
          <div className="text-sm text-light-secondary dark:text-dark-neutral">Total Users</div>
          <div className="text-2xl font-bold text-light-text dark:text-dark-secondary">{rewards.length}</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 ">
        <div className="flex items-center rounded-xl px-4 py-3 w-full md:w-1/2 shadow-sm focus-within:ring-2 focus-within:ring-light-accent/50 dark:focus-within:ring-dark-accent/50 transition bg-light-neutral dark:bg-dark-primary border border-light-secondary/10 dark:border-dark-secondary/20">
          <Search className="w-5 h-5 mr-3 text-light-secondary dark:text-dark-neutral" />
          <input
            type="search"
            placeholder="Search by username or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none text-base bg-transparent text-light-text dark:text-dark-secondary placeholder:text-light-secondary/70 dark:placeholder:text-dark-neutral/70"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-base text-light-text dark:text-dark-secondary">Badge</label>
          <div className="relative bg-light-neutral dark:bg-dark-primary rounded-xl shadow-sm border border-light-secondary/10 dark:border-dark-secondary/20 focus-within:ring-2 focus-within:ring-light-accent/50 dark:focus-within:ring-dark-accent/50 transition">
            <select
              value={selectedBadge}
              onChange={(e) => handleBadgeChange(e.target.value)}
              className="appearance-none bg-transparent w-full pl-5 pr-10 py-3 outline-none text-light-text dark:text-dark-secondary"
            >
              <option value="" className="bg-light-neutral text-light-text dark:bg-dark-primary dark:text-dark-secondary">All Badges</option>
              {BADGE_OPTIONS.slice(1).map((b) => (
                <option key={b} value={b} className={badgeOptionClasses[b] || ''}>
                  {b}
                </option>
              ))}
            </select>
            <ChevronDown className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-light-secondary dark:text-dark-neutral" />
          </div>
        </div>

        <button
          onClick={toggleOrdering}
          className="ml-auto inline-flex items-center gap-2 rounded-xl px-5 py-3 text-base shadow-sm hover:scale-105 hover:shadow-md transition-transform bg-light-neutral dark:bg-dark-primary text-light-text dark:text-dark-secondary border border-light-secondary/10 dark:border-dark-secondary/20"
        >
          <ArrowUpDown className="w-5 h-5 text-light-secondary dark:text-dark-neutral" />
          <span>{ordering === "-points" ? "Top First" : "Lowest First"}</span>
        </button>
      </div>

      <div className="rounded-2xl shadow-md border overflow-hidden transition-all bg-light-neutral dark:bg-dark-primary border-light-secondary/10 dark:border-dark-secondary/20">
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex justify-center text-lg animate-pulse text-light-secondary dark:text-dark-neutral">
              Loading rewards...
            </div>
          ) : error ? (
            <div className="py-12 text-center text-lg text-red-500">{error}</div>
          ) : rewards.length === 0 ? (
            <div className="py-12 text-center text-lg text-light-secondary dark:text-dark-neutral">
              🎁 No rewards found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b-2 border-light-primary dark:border-dark-secondary/30 bg-light-primary/40 dark:bg-dark-background/40">
                    <th className="py-4 px-6 text-left text-sm font-semibold uppercase tracking-wide text-light-secondary dark:text-dark-neutral">User</th>
                    <th className="py-4 px-6 text-center text-sm font-semibold uppercase tracking-wide text-light-secondary dark:text-dark-neutral">Points</th>
                    <th className="py-4 px-6 text-center text-sm font-semibold uppercase tracking-wide text-light-secondary dark:text-dark-neutral">Badge</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold uppercase tracking-wide text-light-secondary dark:text-dark-neutral">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {rewards.map((r, i) => (
                    <motion.tr
                      key={r.id ?? i}
                      whileHover={{ scale: 1.01, y: -2 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="border-b last:border-b-0 border-light-primary dark:border-dark-secondary/20 transition-colors hover:bg-light-primary/50 dark:hover:bg-dark-background/50"
                    >
                      <td className="py-4 px-6 align-middle">
                        <div className="font-semibold text-base text-light-text dark:text-dark-secondary">{r.username ?? "Unknown"}</div>
                        <div className="text-sm mt-1 text-light-secondary dark:text-dark-neutral">{r.email ?? "—"}</div>
                      </td>
                      <td className="py-4 px-6 font-bold text-base text-center text-light-text dark:text-dark-secondary" style={{ minWidth: 110 }}>
                        {r.points ?? 0}
                      </td>
                      <td className="py-4 px-6 text-center align-middle">
                        <div className="flex items-center justify-center">
                          <motion.span
                            whileHover={isPremium(r.badge) ? { scale: 1.06 } : { scale: 1.03 }}
                            transition={{ type: "spring", stiffness: 300, damping: 12 }}
                            className={`relative inline-flex items-center gap-3 px-4 py-2 text-base font-semibold rounded-full ${badgeStyles(r.badge)} cursor-pointer shadow-sm`}
                            style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.03)" }}
                          >
                            {getBadgeIcon(r.badge)}
                            <span className="whitespace-nowrap">{r.badge ?? "Starter"}</span>
                            {isPremium(r.badge) && (
                              <motion.div
                                initial={{ x: "-110%" }}
                                animate={{ x: "110%" }}
                                transition={{ repeat: Infinity, duration: 2.2, ease: "linear", repeatDelay: 2 }}
                                className="absolute top-0 left-0 h-full w-16 opacity-30 pointer-events-none"
                                style={{
                                  background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)",
                                  transform: "skewX(-20deg)",
                                }}
                              />
                            )}
                          </motion.span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-base text-light-secondary dark:text-dark-neutral">{r.reason ?? "—"}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardsPage;