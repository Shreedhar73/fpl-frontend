'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { PositionChip, positionColor } from '@/components/ui/badge';
import { difficultyClass } from '@/components/ui/fixture-tag';
import { Provenance } from '@/components/ui/provenance';
import { usePlayerSheet } from '@/features/squad/components/player-sheet/player-sheet-context';
import type { PlayerList, PlayerListItem } from '@/features/squad/api/players.api';
import { validateSquad } from '@/features/squad/api/players.api';
import { messageFor } from '@/features/squad/api/squad.api';
import type { ApiResponseMeta } from '@/lib/api/types';
import { cx, money, percent, points } from '@/lib/format';
import { isFlagged, statusLabel } from '@/lib/status';

/**
 * Pitch first: fifteen slots in the 2/5/5/3 shape, tap one and the list narrows to that position.
 * The rules are checked here as you pick and again on the server before the advice — the server's
 * verdict wins, this copy of the quotas is a convenience that can go stale for one release.
 *
 * The picked ids are the URL (`?ids=`), so the builder has no state a reload loses and the result
 * is a navigation to the board at `/team/built`.
 */

type Position = PlayerListItem['position'];
const QUOTAS: Record<Position, number> = { GKP: 2, DEF: 5, MID: 5, FWD: 3 };
const ORDER: Position[] = ['GKP', 'DEF', 'MID', 'FWD'];
const LABEL: Record<Position, string> = { GKP: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward' };
const SQUAD_SIZE = 15;
const BUDGET = 1000;
const CLUB_LIMIT = 3;
const PAGE = 80;
type Sort = 'horizon' | 'gw' | 'price-desc' | 'price-asc' | 'name';

function localIssues(picked: PlayerListItem[]): string[] {
  const issues: string[] = [];
  for (const pos of ORDER) {
    const have = picked.filter((p) => p.position === pos).length;
    if (have > QUOTAS[pos]) issues.push(`Too many ${pos} — ${have} of ${QUOTAS[pos]}.`);
  }
  const spend = picked.reduce((s, p) => s + p.nowCost, 0);
  if (spend > BUDGET) issues.push(`Over budget by ${money(spend - BUDGET)}.`);
  const byClub = new Map<string, number>();
  for (const p of picked) byClub.set(p.teamShortName, (byClub.get(p.teamShortName) ?? 0) + 1);
  for (const [club, n] of byClub) if (n > CLUB_LIMIT) issues.push(`${n} from ${club} — the limit is ${CLUB_LIMIT}.`);
  return issues;
}

export function SquadBuilder({ list, meta }: { list: PlayerList; meta: ApiResponseMeta | null }) {
  const router = useRouter();
  const sp = useSearchParams();
  const sheet = usePlayerSheet();
  const players = list.players;
  const byId = useMemo(() => new Map(players.map((p) => [p.playerId, p])), [players]);
  const fixturesByClub = useMemo(
    () => new Map(list.fixtures.map((t) => [t.teamShortName, t.fixtures])),
    [list.fixtures],
  );
  const gws = list.horizonGameweekIds;

  const pickedIds = useMemo(
    () => (sp.get('ids') ?? '').split(',').filter((id) => byId.has(id)),
    [sp, byId],
  );
  const picked = pickedIds.map((id) => byId.get(id)).filter((p): p is PlayerListItem => p !== undefined);
  const setPicked = (ids: string[]) => {
    const next = new URLSearchParams(sp.toString());
    if (ids.length === 0) next.delete('ids');
    else next.set('ids', ids.join(','));
    const q = next.toString();
    router.replace(q ? `/build?${q}` : '/build', { scroll: false });
  };

  const [slot, setSlot] = useState<Position | 'ALL'>('ALL');
  const [sort, setSort] = useState<Sort>('horizon');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [serverIssues, setServerIssues] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const spend = picked.reduce((s, p) => s + p.nowCost, 0);
  const left = BUDGET - spend;
  const projected = picked.reduce((s, p) => s + (p.epNextGw ?? 0), 0);
  const issues = localIssues(picked);
  const complete = picked.length === SQUAD_SIZE;
  const clubCounts = new Map<string, number>();
  for (const p of picked) clubCounts.set(p.teamShortName, (clubCounts.get(p.teamShortName) ?? 0) + 1);

  const matches = useMemo(() => {
    const t = search.trim().toLowerCase();
    const filtered = players
      .filter((p) => slot === 'ALL' || p.position === slot)
      .filter((p) => t === '' || p.webName.toLowerCase().includes(t) || p.teamShortName.toLowerCase().includes(t));
    const sorted = [...filtered];
    switch (sort) {
      case 'gw':
        sorted.sort((a, b) => (b.epNextGw ?? -1) - (a.epNextGw ?? -1));
        break;
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
        // null is not zero: an unprojected player sorts last, not level with a 0.0.
        sorted.sort((a, b) => (b.epHorizon ?? -1) - (a.epHorizon ?? -1));
    }
    return sorted;
  }, [players, slot, search, sort]);

  const pick = (id: string) => {
    setServerIssues(null);
    setError(null);
    if (pickedIds.includes(id)) setPicked(pickedIds.filter((x) => x !== id));
    else if (pickedIds.length < SQUAD_SIZE) setPicked([...pickedIds, id]);
  };

  async function advise() {
    setBusy(true);
    setError(null);
    setServerIssues(null);
    try {
      const verdict = await validateSquad(pickedIds);
      if (!verdict.legal) {
        setServerIssues(verdict.violations.map((v) => v.message));
        return;
      }
      router.push(`/team/built?ids=${pickedIds.join(',')}&ft=1`);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  const remaining = SQUAD_SIZE - picked.length;
  const canAdvise = complete && issues.length === 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            Build by hand{list.gameweekId !== null && ` · for gameweek ${list.gameweekId}`}
          </span>
          <h1 className="num text-[28px] font-extrabold leading-[1.05] text-ink sm:text-[30px]">
            {picked.length === 0 ? 'Fifteen to pick' : complete ? 'Fifteen picked' : `${picked.length} of fifteen`}
          </h1>
          <p className="text-[13px] text-ink-2">Tap a slot, pick from the list. Legality is checked here as you go and again on the server before any advice.</p>
        </div>
        <div className="flex flex-wrap items-center gap-5 md:gap-7">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Left to spend</span>
            <span className={cx('num text-2xl font-extrabold', left < 0 ? 'text-bad' : 'text-ink')}>{money(left)}</span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Projected · GW {list.gameweekId ?? '—'}</span>
            <span className="num text-2xl font-extrabold text-ink">{points(projected)}</span>
          </div>
          <button
            type="button"
            onClick={advise}
            disabled={!canAdvise || busy}
            className={cx(
              'num h-10 rounded-[10px] px-4 text-[13px] font-bold',
              canAdvise ? 'bg-accent text-accent-ink hover:opacity-90' : 'border border-line-strong text-ink-3 opacity-60',
            )}
          >
            {busy ? 'Checking…' : complete ? (issues.length > 0 ? 'Not legal yet' : 'Advise this 15') : `Advise this 15 · ${remaining} to go`}
          </button>
        </div>
      </div>

      {(issues.length > 0 || serverIssues || error) && (
        <ul className="flex flex-col gap-0.5 rounded-[10px] border border-[color-mix(in_oklab,var(--warn)_35%,transparent)] bg-[color-mix(in_oklab,var(--warn)_10%,transparent)] px-3.5 py-2.5 text-xs text-ink-2">
          {[...issues, ...(serverIssues ?? []), ...(error ? [error] : [])].map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[600px_minmax(0,1fr)] lg:gap-10">
        <div className="flex flex-col gap-3">
          <div className="pitch pitch-markings relative overflow-hidden rounded-[14px] px-2 pb-7 pt-6 sm:px-4">
            <span aria-hidden className="pitch-centre" />
            <div className="relative flex flex-col gap-3 sm:gap-4">
              {ORDER.map((pos) => {
                const line = picked.filter((p) => p.position === pos);
                const empties = Math.max(0, QUOTAS[pos] - line.length);
                return (
                  <div key={pos} className="flex flex-wrap justify-center gap-1.5 sm:gap-2.5">
                    {line.map((p) => (
                      <PickedShirt
                        key={p.playerId}
                        p={p}
                        onRemove={() => pick(p.playerId)}
                        onOpen={() => sheet.open(p.playerId)}
                        over={(clubCounts.get(p.teamShortName) ?? 0) > CLUB_LIMIT}
                      />
                    ))}
                    {Array.from({ length: empties }).map((_, i) => (
                      <button
                        key={`${pos}-${i}`}
                        type="button"
                        onClick={() => setSlot(pos)}
                        aria-label={`Pick a ${LABEL[pos].toLowerCase()}`}
                        className={cx(
                          'flex h-[92px] w-[4.5rem] flex-col items-center justify-center gap-1 rounded-[10px] border-[1.5px] border-dashed transition-colors sm:w-[6.5rem]',
                          slot === pos && i === 0
                            ? 'border-white bg-white/10 text-white'
                            : 'border-white/35 text-white/70 hover:border-white/70 hover:text-white',
                        )}
                      >
                        <PositionChip position={pos} />
                        {slot === pos && i === 0 ? (
                          <span className="text-[11px] font-semibold">picking</span>
                        ) : (
                          <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="text-ink-2">
              Clubs:{' '}
              {[...clubCounts.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([c, n]) => (
                  <span key={c} className={cx('mr-2', n >= CLUB_LIMIT && 'font-bold', n > CLUB_LIMIT && 'text-bad')}>
                    {c} {n}
                  </span>
                ))}
              {clubCounts.size === 0 && <span className="text-ink-3">none yet</span>}
            </span>
            <span className="text-ink-3">· 3 per club max</span>
            <span className="flex-1" />
            {picked.length > 0 && (
              <button type="button" onClick={() => setPicked([])} className="border-b border-dashed border-line-strong text-xs font-semibold text-ink-3 hover:text-ink">
                Clear
              </button>
            )}
          </div>
          <Provenance meta={meta} modelVersion={list.modelVersion} gameweekId={list.gameweekId} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div role="tablist" aria-label="Position" className="inline-flex items-center gap-[3px] rounded-[9px] border border-line bg-surface p-[3px]">
              {(['ALL', ...ORDER] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={slot === p}
                  onClick={() => setSlot(p)}
                  className={cx('h-7 rounded-md px-3 text-xs font-semibold', slot === p ? 'bg-surface-3 text-ink' : 'text-ink-3 hover:text-ink')}
                >
                  {p === 'ALL' ? 'All' : p}
                </button>
              ))}
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort" className="h-[34px] rounded-[9px] border border-line bg-surface px-2.5 text-xs text-ink">
              <option value="horizon">Σ GW {gws[0]}–{gws[gws.length - 1]}</option>
              <option value="gw">This gameweek</option>
              <option value="price-desc">Most expensive</option>
              <option value="price-asc">Cheapest</option>
              <option value="name">Name</option>
            </select>
            <div className="flex h-[34px] min-w-[160px] flex-1 items-center gap-2 rounded-[9px] border border-line bg-surface px-3">
              <svg aria-hidden viewBox="0 0 24 24" className="size-4 shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6" /><path d="m20 20-4.2-4.2" /></svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or club"
                aria-label="Search players"
                className="min-w-0 flex-1 bg-transparent text-xs text-ink placeholder:text-ink-3 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="border-b border-line-strong text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                  <th scope="col" className="px-3 py-2.5 text-left">{slot === 'ALL' ? 'Player' : LABEL[slot]}</th>
                  <th scope="col" className="px-3 py-2.5 text-right">£</th>
                  <th scope="col" className="px-3 py-2.5 text-right">GW {list.gameweekId ?? ''}</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Σ {gws.length > 0 ? `${gws[0]}–${gws[gws.length - 1]}` : ''}</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Plays</th>
                  <th scope="col" className="px-3 py-2.5 text-left">Next {gws.length}</th>
                  <th scope="col" className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {matches.slice(0, PAGE).map((p) => {
                  const isPicked = pickedIds.includes(p.playerId);
                  const clubCount = clubCounts.get(p.teamShortName) ?? 0;
                  const full =
                    !isPicked &&
                    (picked.length >= SQUAD_SIZE || picked.filter((x) => x.position === p.position).length >= QUOTAS[p.position]);
                  const flagged = isFlagged(p.status);
                  return (
                    <tr key={p.playerId} className={cx('border-b border-line', isPicked && 'bg-surface-2')}>
                      <td className="px-3 py-1.5">
                        <button type="button" onClick={() => sheet.open(p.playerId)} aria-label={`Open ${p.webName}`} className="flex flex-col items-start text-left hover:underline underline-offset-2">
                          <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
                            {slot === 'ALL' && <span aria-hidden className="block h-3.5 w-1 rounded-sm" style={{ backgroundColor: positionColor(p.position) }} />}
                            {p.webName}
                            {flagged && (
                              <span title={p.news ?? statusLabel(p.status)} className={cx('text-[10px] font-bold', p.status === 'd' ? 'text-warn' : 'text-bad')}>!</span>
                            )}
                          </span>
                          <span className="text-[11px] text-ink-3">
                            {p.teamShortName}
                            {!isPicked && clubCount >= CLUB_LIMIT && <span className="text-warn"> · at {clubCount} of {CLUB_LIMIT}</span>}
                            {!isPicked && clubCount > 0 && clubCount < CLUB_LIMIT && <span> · {clubCount} of {CLUB_LIMIT}</span>}
                          </span>
                        </button>
                      </td>
                      <td className="num px-3 py-1.5 text-right text-[13px] text-ink-2">{(p.nowCost / 10).toFixed(1)}</td>
                      <td className="num px-3 py-1.5 text-right text-[13px] font-bold text-ink">{p.epNextGw === null ? <span className="text-ink-3">—</span> : points(p.epNextGw)}</td>
                      <td className="num px-3 py-1.5 text-right text-[15px] font-extrabold text-ink">{p.epHorizon === null ? <span className="text-ink-3">—</span> : points(p.epHorizon)}</td>
                      <td className="num px-3 py-1.5 text-right text-[13px] text-ink-2">{p.playProbability === null ? '—' : percent(p.playProbability)}</td>
                      <td className="px-3 py-1.5">
                        <span className="flex gap-[3px]">
                          {gws.map((gw) => {
                            const fx = (fixturesByClub.get(p.teamShortName) ?? []).filter((f) => f.gameweekId === gw);
                            return (
                              <span
                                key={gw}
                                title={fx.length === 0 ? `GW ${gw}: blank` : `GW ${gw}: ${fx.map((f) => `${f.opponentShortName} ${f.isHome ? 'H' : 'A'} (${f.difficulty})`).join(', ')}`}
                                className={cx(
                                  'num inline-flex h-4 w-8 items-center justify-center rounded-[4px] text-[9px] font-bold',
                                  fx.length === 0 ? 'border border-dashed border-line-strong text-ink-3' : difficultyClass(fx[0].difficulty),
                                  fx.length > 1 && 'ring-1 ring-ink/40',
                                )}
                              >
                                {fx.length === 0 ? '·' : fx[0].opponentShortName}
                              </span>
                            );
                          })}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => pick(p.playerId)}
                          disabled={full}
                          className={cx(
                            'num h-[30px] rounded-lg px-3 text-xs font-bold',
                            isPicked ? 'border border-line-strong text-ink-2 hover:bg-surface-2' : 'bg-accent text-accent-ink hover:opacity-90 disabled:opacity-40',
                          )}
                        >
                          {isPicked ? 'Remove' : 'Pick'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {matches.length > PAGE && (
              <p className="px-3 py-2 text-xs text-ink-3">Showing {PAGE} of {matches.length}. Narrow by position or name.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PickedShirt({ p, onRemove, onOpen, over }: { p: PlayerListItem; onRemove: () => void; onOpen: () => void; over: boolean }) {
  return (
    <div className={cx('relative w-[4.5rem] overflow-hidden rounded-[10px] border bg-surface shadow-[var(--shadow-raised)] sm:w-[6.5rem]', over ? 'border-bad' : 'border-line-strong')}>
      <div aria-hidden className="h-[5px]" style={{ backgroundColor: positionColor(p.position) }} />
      <button type="button" onClick={onRemove} aria-label={`Remove ${p.webName}`} className="absolute right-1 top-2 grid size-[18px] place-items-center rounded-full bg-surface-3 text-[11px] text-ink-2 hover:bg-bad hover:text-white">
        ×
      </button>
      <button type="button" onClick={onOpen} aria-label={`Open ${p.webName}`} className="flex w-full flex-col items-start gap-px px-2 pb-2 pt-1.5 text-left">
        <span className="w-full truncate pr-4 text-[11px] font-semibold text-ink sm:text-[12.5px]">{p.webName}</span>
        <span className="text-[10px] text-ink-3">{p.teamShortName} · {money(p.nowCost)}</span>
        <span className="num mt-0.5 text-[17px] font-bold leading-none text-ink sm:text-[20px]">
          {p.epNextGw === null ? '—' : points(p.epNextGw)}
          <span className="ml-0.5 text-[9px] font-semibold text-ink-3">xP</span>
        </span>
      </button>
    </div>
  );
}
