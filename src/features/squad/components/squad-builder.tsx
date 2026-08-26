'use client';

import { useMemo, useState } from 'react';
import {
  adviseBuiltSquad,
  validateSquad,
  type PlayerListItem,
} from '../api/players.api';
import { messageFor, money, type Advice } from '../api/squad.api';
import { AdvicePanel } from './advice-panel';

/**
 * The one client component in the app, because picking a squad is the one thing here that is
 * genuinely interactive: every other view is server-rendered.
 *
 * The rules are checked twice on purpose. Locally, so a click gets an answer immediately and the
 * user is never waiting on a round trip to learn they already have five defenders; and on the
 * server when they submit, where **the server's verdict wins**. The local check is a convenience
 * that can be wrong; the server reads prices and positions from the database and is the only one
 * that decides.
 */

const QUOTAS: Record<PlayerListItem['position'], number> = {
  GKP: 2,
  DEF: 5,
  MID: 5,
  FWD: 3,
};
const SQUAD_SIZE = 15;
const BUDGET = 1000;
const CLUB_LIMIT = 3;
const ORDER: PlayerListItem['position'][] = ['GKP', 'DEF', 'MID', 'FWD'];

/**
 * The local mirror of the backend's legality rules. The constants above are a **convenience copy**
 * and the reason they are safe to hardcode here is that they are never the answer: the server
 * reads them from `scoring_config` and its verdict is what gates the advice. If FPL changes a
 * quota, this hint goes stale for one release and the server still refuses the squad.
 */
function localIssues(picked: PlayerListItem[]): string[] {
  const issues: string[] = [];

  for (const pos of ORDER) {
    const have = picked.filter((p) => p.position === pos).length;
    if (have > QUOTAS[pos]) issues.push(`Too many ${pos} — ${have} of ${QUOTAS[pos]}.`);
  }

  const spend = picked.reduce((sum, p) => sum + p.nowCost, 0);
  if (spend > BUDGET) issues.push(`Over budget by ${money(spend - BUDGET)}.`);

  const byClub = new Map<string, number>();
  for (const p of picked) {
    byClub.set(p.teamShortName, (byClub.get(p.teamShortName) ?? 0) + 1);
  }
  for (const [club, n] of byClub) {
    if (n > CLUB_LIMIT) issues.push(`${n} players from ${club} — the limit is ${CLUB_LIMIT}.`);
  }

  return issues;
}

export function SquadBuilder({ players }: { players: PlayerListItem[] }) {
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [position, setPosition] = useState<PlayerListItem['position'] | 'ALL'>(
    'ALL',
  );
  const [search, setSearch] = useState('');
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [serverIssues, setServerIssues] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const byId = useMemo(
    () => new Map(players.map((p) => [p.playerId, p])),
    [players],
  );
  const picked = pickedIds
    .map((id) => byId.get(id))
    .filter((p): p is PlayerListItem => p !== undefined);

  const spend = picked.reduce((sum, p) => sum + p.nowCost, 0);
  const issues = localIssues(picked);
  const complete = picked.length === SQUAD_SIZE;

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return players
      .filter((p) => position === 'ALL' || p.position === position)
      .filter(
        (p) =>
          term === '' ||
          p.webName.toLowerCase().includes(term) ||
          p.teamShortName.toLowerCase().includes(term),
      )
      .sort((a, b) => (b.epNextGw ?? -1) - (a.epNextGw ?? -1))
      .slice(0, 60);
  }, [players, position, search]);

  function toggle(id: string) {
    setAdvice(null);
    setServerIssues(null);
    setError(null);
    setPickedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= SQUAD_SIZE
          ? prev
          : [...prev, id],
    );
  }

  async function submit() {
    setBusy(true);
    setError(null);
    setServerIssues(null);
    try {
      // Revalidated server-side even when the local check is happy, because the local check is a
      // hint: it works from a copy of the rules and from prices that could be a sync behind.
      const verdict = await validateSquad(pickedIds);
      if (!verdict.legal) {
        setServerIssues(verdict.violations.map((v) => v.message));
        return;
      }
      setAdvice(await adviseBuiltSquad(pickedIds));
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  if (advice) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Your squad
          </h1>
          <button
            type="button"
            onClick={() => setAdvice(null)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
          >
            Keep editing
          </button>
        </div>
        <AdvicePanel advice={advice} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Build a squad
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Fifteen players, {money(BUDGET)}, two keepers, five defenders, five
          midfielders, three forwards, and at most {CLUB_LIMIT} from any one club.
        </p>
      </header>

      <div className="sticky top-0 z-10 rounded-lg bg-zinc-50/95 p-3 ring-1 ring-black/5 backdrop-blur dark:bg-zinc-900/95 dark:ring-white/10">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {picked.length}/{SQUAD_SIZE}
          </span>
          {ORDER.map((pos) => {
            const have = picked.filter((p) => p.position === pos).length;
            return (
              <span
                key={pos}
                className={
                  have > QUOTAS[pos]
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-zinc-600 dark:text-zinc-400'
                }
              >
                {pos} {have}/{QUOTAS[pos]}
              </span>
            );
          })}
          <span
            className={
              spend > BUDGET
                ? 'font-medium text-red-600 dark:text-red-400'
                : 'text-zinc-600 dark:text-zinc-400'
            }
          >
            {money(spend)} of {money(BUDGET)}
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={!complete || busy}
            className="ml-auto rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-zinc-100 dark:text-zinc-900 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
          >
            {busy ? 'Checking…' : 'Get advice'}
          </button>
        </div>

        {issues.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {issues.map((i) => (
              <li key={i} className="text-xs text-red-600 dark:text-red-400">
                {i}
              </li>
            ))}
          </ul>
        )}
        {serverIssues && (
          <div className="mt-2 rounded-md bg-amber-50 p-2 dark:bg-amber-950/40">
            <p className="text-[11px] font-medium uppercase tracking-wide text-amber-900 dark:text-amber-200">
              The server refused this squad
            </p>
            <ul className="mt-1 space-y-0.5">
              {serverIssues.map((m) => (
                <li
                  key={m}
                  className="text-xs text-amber-900 dark:text-amber-200"
                >
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}
        {error && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {picked.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {picked.map((p) => (
            <button
              key={p.playerId}
              type="button"
              onClick={() => toggle(p.playerId)}
              title="Remove"
              className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              {p.webName} <span className="opacity-60">{p.position}</span> ×
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1">
          {(['ALL', ...ORDER] as const).map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setPosition(pos)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                position === pos
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or club"
          className="min-w-48 flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              <th className="pb-1 font-medium">Player</th>
              <th className="pb-1 text-right font-medium">Price</th>
              <th className="pb-1 text-right font-medium">GW pts</th>
              <th className="pb-1 text-right font-medium">Plays</th>
              <th className="pb-1" />
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => {
              const isPicked = pickedIds.includes(p.playerId);
              return (
                <tr
                  key={p.playerId}
                  className="border-t border-zinc-100 dark:border-zinc-800"
                >
                  <td className="py-1.5">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {p.webName}
                    </span>{' '}
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {p.position} · {p.teamShortName}
                    </span>
                    {p.status !== 'a' && (
                      <span
                        title={p.news ?? undefined}
                        className="ml-1 rounded bg-amber-100 px-1 text-[10px] text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                      >
                        {p.status}
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {money(p.nowCost)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {/* null is not zero: the model has not projected this player. */}
                    {p.epNextGw === null ? '—' : p.epNextGw.toFixed(2)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                    {p.playProbability === null
                      ? '—'
                      : `${Math.round(p.playProbability * 100)}%`}
                  </td>
                  <td className="py-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggle(p.playerId)}
                      disabled={!isPicked && picked.length >= SQUAD_SIZE}
                      className="rounded-md border border-zinc-300 px-2 py-0.5 text-xs disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700"
                    >
                      {isPicked ? 'Remove' : 'Add'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="py-4 text-sm text-zinc-500 dark:text-zinc-400">
            Nobody matches that.
          </p>
        )}
      </div>
    </div>
  );
}
