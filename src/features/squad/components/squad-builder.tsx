'use client';

import { useMemo, useState } from 'react';
import { PositionChip } from '@/components/ui/badge';
import { buttonClass } from '@/components/ui/button';
import { Card, SectionHeading } from '@/components/ui/card';
import { Meter } from '@/components/ui/meter';
import { Note } from '@/components/ui/note';
import { Provenance } from '@/components/ui/provenance';
import type { ApiResponseMeta } from '@/lib/api/types';
import { cx, money, percent, points } from '@/lib/format';
import {
  adviseBuiltSquad,
  validateSquad,
  type PlayerListItem,
} from '../api/players.api';
import { messageFor, type Advice } from '../api/squad.api';
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
 *
 * Layout: the squad state is a rail beside the list on a wide screen and a sticky strip above it on
 * a narrow one. Either way it is on screen while you pick, because "which position am I short of"
 * is the question every single click needs answered.
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
const PAGE = 60;

/** FPL's availability codes. `a` is the only one that needs no explanation, so it gets no chip. */
const STATUS_LABEL: Record<string, string> = {
  d: 'Doubtful',
  i: 'Injured',
  s: 'Suspended',
  u: 'Unavailable',
  n: 'Not in squad',
};

type Sort = 'ep' | 'price-desc' | 'price-asc' | 'name';

const SORT_LABEL: Record<Sort, string> = {
  ep: 'Projected points',
  'price-desc': 'Most expensive',
  'price-asc': 'Cheapest',
  name: 'Name',
};

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

export function SquadBuilder({
  players,
  meta,
  gameweekId,
  modelVersion,
}: {
  players: PlayerListItem[];
  meta: ApiResponseMeta | null;
  gameweekId: number | null;
  modelVersion: string | null;
}) {
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [position, setPosition] = useState<PlayerListItem['position'] | 'ALL'>(
    'ALL',
  );
  const [club, setClub] = useState('ALL');
  const [sort, setSort] = useState<Sort>('ep');
  const [search, setSearch] = useState('');
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [adviceMeta, setAdviceMeta] = useState<ApiResponseMeta | null>(null);
  const [serverIssues, setServerIssues] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const byId = useMemo(
    () => new Map(players.map((p) => [p.playerId, p])),
    [players],
  );
  const clubs = useMemo(
    () => [...new Set(players.map((p) => p.teamShortName))].sort(),
    [players],
  );
  const picked = pickedIds
    .map((id) => byId.get(id))
    .filter((p): p is PlayerListItem => p !== undefined);

  const spend = picked.reduce((sum, p) => sum + p.nowCost, 0);
  const projected = picked.reduce((sum, p) => sum + (p.epNextGw ?? 0), 0);
  const issues = localIssues(picked);
  const complete = picked.length === SQUAD_SIZE;
  const clubCounts = new Map<string, number>();
  for (const p of picked) {
    clubCounts.set(p.teamShortName, (clubCounts.get(p.teamShortName) ?? 0) + 1);
  }

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = players
      .filter((p) => position === 'ALL' || p.position === position)
      .filter((p) => club === 'ALL' || p.teamShortName === club)
      .filter(
        (p) =>
          term === '' ||
          p.webName.toLowerCase().includes(term) ||
          p.teamShortName.toLowerCase().includes(term),
      );

    const sorted = [...filtered];
    switch (sort) {
      case 'price-desc':
        sorted.sort((a, b) => b.nowCost - a.nowCost);
        break;
      case 'price-asc':
        sorted.sort((a, b) => a.nowCost - b.nowCost);
        break;
      case 'name':
        sorted.sort((a, b) => a.webName.localeCompare(b.webName));
        break;
      default:
        // null is not zero: a player the model has not projected sorts last, not level with a 0.0.
        sorted.sort((a, b) => (b.epNextGw ?? -1) - (a.epNextGw ?? -1));
    }
    return sorted;
  }, [players, position, club, search, sort]);

  const visible = matches.slice(0, PAGE);

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
      const result = await adviseBuiltSquad(pickedIds);
      setAdvice(result.data);
      setAdviceMeta(result.meta);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  if (advice) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Your squad
            </h1>
            <Provenance
              className="mt-1"
              meta={adviceMeta}
              modelVersion={advice.modelVersion}
              gameweekId={advice.gameweekId}
            />
          </div>
          <button
            type="button"
            onClick={() => setAdvice(null)}
            className={buttonClass({ variant: 'secondary', size: 'sm' })}
          >
            Keep editing
          </button>
        </div>
        <AdvicePanel advice={advice} />
      </div>
    );
  }

  const squadPanel = (
    <div className="flex flex-col gap-3">
      <Meter
        label={`Squad · ${money(BUDGET - spend)} left`}
        value={picked.length}
        max={SQUAD_SIZE}
        display={`${picked.length}/${SQUAD_SIZE}`}
        tone={complete ? 'good' : 'neutral'}
      />
      <Meter
        label="Budget"
        value={spend}
        max={BUDGET}
        display={`${money(spend)} / ${money(BUDGET)}`}
        tone={spend > BUDGET ? 'bad' : spend > BUDGET * 0.95 ? 'warn' : 'neutral'}
      />

      <div className="grid grid-cols-2 gap-3">
        {ORDER.map((pos) => {
          const have = picked.filter((p) => p.position === pos).length;
          return (
            <Meter
              key={pos}
              label={pos}
              value={have}
              max={QUOTAS[pos]}
              display={`${have}/${QUOTAS[pos]}`}
              tone={
                have > QUOTAS[pos]
                  ? 'bad'
                  : have === QUOTAS[pos]
                    ? 'good'
                    : 'neutral'
              }
            />
          );
        })}
      </div>

      <dl className="flex items-baseline justify-between border-t border-line pt-3 text-xs">
        <dt className="text-ink-3">Projected this gameweek</dt>
        <dd className="font-semibold tabular-nums text-ink">
          {points(projected)} pts
          <span className="ml-1 font-normal text-ink-3">before captaincy</span>
        </dd>
      </dl>

      {picked.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {ORDER.map((pos) => {
            const line = picked.filter((p) => p.position === pos);
            if (line.length === 0) return null;
            return (
              <div key={pos} className="flex flex-wrap items-center gap-1">
                <PositionChip position={pos} className="mr-0.5" />
                {line.map((p) => (
                  <button
                    key={p.playerId}
                    type="button"
                    onClick={() => toggle(p.playerId)}
                    title={`Remove ${p.webName}`}
                    className={cx(
                      'inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2 py-0.5',
                      'text-[11px] text-ink hover:border-line-strong hover:bg-surface-3',
                      (clubCounts.get(p.teamShortName) ?? 0) > CLUB_LIMIT &&
                        'border-bad text-bad',
                    )}
                  >
                    {p.webName}
                    <span aria-hidden className="text-ink-3">
                      ×
                    </span>
                    <span className="sr-only">remove</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {issues.length > 0 && (
        <Note tone="warn" title="Not legal yet">
          <ul className="flex flex-col gap-0.5">
            {issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </Note>
      )}

      {serverIssues && (
        <Note tone="warn" title="The server refused this squad">
          <ul className="flex flex-col gap-0.5">
            {serverIssues.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Note>
      )}

      {error && (
        <Note tone="warn" title="That did not work">
          {error}
        </Note>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!complete || busy}
        title={
          complete
            ? undefined
            : `Pick ${SQUAD_SIZE - picked.length} more player${SQUAD_SIZE - picked.length === 1 ? '' : 's'}`
        }
        className={buttonClass({ className: 'w-full' })}
      >
        {busy
          ? 'Checking…'
          : complete
            ? 'Get advice on this squad'
            : `${SQUAD_SIZE - picked.length} more to pick`}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Build a squad
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-2">
          Fifteen players, {money(BUDGET)}, two keepers, five defenders, five
          midfielders, three forwards, and at most {CLUB_LIMIT} from any one
          club. The projection beside each price is this app&apos;s model, not
          FPL&apos;s.
        </p>
        <Provenance
          className="mt-2"
          meta={meta}
          modelVersion={modelVersion}
          gameweekId={gameweekId}
        />
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Filter by position"
              className="flex gap-1 rounded-lg bg-surface-2 p-0.5"
            >
              {(['ALL', ...ORDER] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setPosition(pos)}
                  aria-pressed={position === pos}
                  className={cx(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    position === pos
                      ? 'bg-surface text-ink shadow-[var(--shadow-card)]'
                      : 'text-ink-2 hover:text-ink',
                  )}
                >
                  {pos}
                </button>
              ))}
            </div>

            <label className="sr-only" htmlFor="club-filter">
              Club
            </label>
            <select
              id="club-filter"
              value={club}
              onChange={(e) => setClub(e.target.value)}
              className="rounded-lg border border-line-strong bg-surface px-2 py-1.5 text-xs text-ink"
            >
              <option value="ALL">All clubs</option>
              {clubs.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="sort-by">
              Sort by
            </label>
            <select
              id="sort-by"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-lg border border-line-strong bg-surface px-2 py-1.5 text-xs text-ink"
            >
              {(Object.keys(SORT_LABEL) as Sort[]).map((s) => (
                <option key={s} value={s}>
                  {SORT_LABEL[s]}
                </option>
              ))}
            </select>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or club"
              aria-label="Search players"
              className="min-w-40 flex-1 rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-ink-3"
            />
          </div>

          {/* On a narrow screen the rail moves above the list and stays in view while you pick. */}
          <Card className="lg:hidden" padded>
            {squadPanel}
          </Card>

          <Card padded={false} className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Players matching the current filters
              </caption>
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-wider text-ink-3">
                  <th className="px-3 py-2 font-medium">Player</th>
                  <th className="px-2 py-2 text-right font-medium">Price</th>
                  <th className="px-2 py-2 text-right font-medium">
                    <abbr title="Projected points, this gameweek">xP</abbr>
                  </th>
                  <th className="hidden px-2 py-2 text-right font-medium sm:table-cell">
                    Plays
                  </th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => {
                  const isPicked = pickedIds.includes(p.playerId);
                  const full = !isPicked && picked.length >= SQUAD_SIZE;
                  return (
                    <tr
                      key={p.playerId}
                      className={cx(
                        'border-b border-line last:border-0',
                        isPicked ? 'bg-surface-2' : 'hover:bg-surface-2',
                      )}
                    >
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <PositionChip position={p.position} />
                          <span className="font-medium text-ink">
                            {p.webName}
                          </span>
                          <span className="text-xs text-ink-3">
                            {p.teamShortName}
                          </span>
                          {p.status !== 'a' && (
                            <span
                              title={p.news || undefined}
                              className="rounded bg-[color-mix(in_oklab,var(--warn)_16%,transparent)] px-1.5 py-0.5 text-[10px] font-medium text-warn"
                            >
                              {STATUS_LABEL[p.status] ?? p.status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums text-ink-2">
                        {money(p.nowCost)}
                      </td>
                      <td className="px-2 py-2 text-right font-medium tabular-nums text-ink">
                        {/* null is not zero: the model has not projected this player. */}
                        {p.epNextGw === null ? '—' : points(p.epNextGw)}
                      </td>
                      <td className="hidden px-2 py-2 text-right tabular-nums text-ink-3 sm:table-cell">
                        {p.playProbability === null
                          ? '—'
                          : percent(p.playProbability)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => toggle(p.playerId)}
                          disabled={full}
                          title={
                            full
                              ? 'The squad already has 15 players'
                              : isPicked
                                ? `Remove ${p.webName}`
                                : `Add ${p.webName}`
                          }
                          className={buttonClass({
                            variant: isPicked ? 'primary' : 'secondary',
                            size: 'sm',
                          })}
                        >
                          {isPicked ? 'Remove' : 'Add'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {matches.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-ink-3">
                Nobody matches that. Try clearing the club filter or the search.
              </p>
            )}
          </Card>

          {matches.length > PAGE && (
            <p className="text-[11px] text-ink-3">
              Showing the first {PAGE} of {matches.length} matches — narrow the
              filters to see the rest.
            </p>
          )}
        </div>

        <Card className="hidden lg:sticky lg:top-16 lg:block">
          <SectionHeading
            title="Your squad"
            subtitle="Legality is checked here as you pick, and again on the server before any advice."
            level={3}
          />
          <div className="mt-3">{squadPanel}</div>
        </Card>
      </div>
    </div>
  );
}
