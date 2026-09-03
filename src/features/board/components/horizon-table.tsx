'use client';

import { useMemo, useState } from 'react';
import { PositionChip, positionColor } from '@/components/ui/badge';
import { BlankTag, FixtureTag } from '@/components/ui/fixture-tag';
import { PlayerTrigger } from '@/features/squad/components/player-sheet/player-trigger';
import { cx, money, percent, points } from '@/lib/format';
import { positionOrder, type Position } from '@/lib/horizon';
import { isFlagged, statusLabel } from '@/lib/status';

export interface LedgerCell {
  gameweekId: number;
  ep: number | null;
  fixtures: { opponentShortName: string; isHome: boolean; difficulty: number }[];
}

export interface LedgerRow {
  playerId: string;
  webName: string;
  position: Position;
  teamShortName: string;
  nowCost: number;
  role: 'captain' | 'vice' | 'starter' | 'bench';
  benchOrder: number | null;
  slot: number;
  isCaptain: boolean;
  status: string;
  news: string | null;
  chance: number | null;
  plays: number | null;
  cells: LedgerCell[];
  sum: number | null;
  inBest: boolean;
}

type SortKey = 'sum' | 'price' | 'plays' | `gw:${number}`;

/** Sorting only; everything else in the row arrived rendered from the server's rows. */
export function HorizonTable({ rows, gws, isModels }: { rows: LedgerRow[]; gws: number[]; isModels: boolean }) {
  const [sort, setSort] = useState<SortKey>('sum');
  const [desc, setDesc] = useState(true);

  const sorted = useMemo(() => {
    const value = (r: LedgerRow): number => {
      if (sort === 'sum') return r.sum ?? -1;
      if (sort === 'price') return r.nowCost;
      if (sort === 'plays') return r.plays ?? -1;
      const gw = Number(sort.slice(3));
      return r.cells.find((c) => c.gameweekId === gw)?.ep ?? -1;
    };
    return [...rows].sort((a, b) => {
      const byPos = positionOrder(a.position) - positionOrder(b.position);
      if (byPos !== 0) return byPos;
      return desc ? value(b) - value(a) : value(a) - value(b);
    });
  }, [rows, sort, desc]);

  const toggle = (key: SortKey) => {
    if (key === sort) setDesc((d) => !d);
    else {
      setSort(key);
      setDesc(true);
    }
  };

  const th = (key: SortKey, label: string, opts: { first?: boolean } = {}) => (
    <th key={key} scope="col" className={cx('whitespace-nowrap px-3 py-2.5 text-right', opts.first && 'text-ink')}>
      <button
        type="button"
        onClick={() => toggle(key)}
        aria-sort={sort === key ? (desc ? 'descending' : 'ascending') : undefined}
        className={cx('inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] hover:text-ink', sort === key ? 'text-ink' : 'text-ink-3')}
      >
        {label}
        <span aria-hidden className={cx('text-[9px]', sort === key ? 'opacity-100' : 'opacity-0')}>{desc ? '▼' : '▲'}</span>
      </button>
    </th>
  );

  let lastPos: Position | null = null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse">
        <thead>
          <tr className="border-b border-line-strong">
            <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Player</th>
            <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Role</th>
            {th('price', '£')}
            {th('plays', 'Plays')}
            {gws.map((gw, i) => th(`gw:${gw}`, `GW ${gw}`, { first: i === 0 }))}
            {th('sum', `Σ ${gws[0]}–${gws[gws.length - 1]}`, { first: true })}
            <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Best 15</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const group = r.position !== lastPos;
            lastPos = r.position;
            return (
              <Row key={r.playerId} r={r} group={group} isModels={isModels} />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Row({ r, group, isModels }: { r: LedgerRow; group: boolean; isModels: boolean }) {
  const flagged = isFlagged(r.status);
  return (
    <>
      {group && (
        <tr>
          <td colSpan={99} className="px-3 pb-1.5 pt-4">
            <PositionChip position={r.position} />
          </td>
        </tr>
      )}
      <tr className="border-b border-line">
        <td className="px-3 py-2">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="block h-[26px] w-1 rounded-sm" style={{ backgroundColor: positionColor(r.position) }} />
            <PlayerTrigger playerId={r.playerId} name={r.webName} className="min-w-0 flex-col items-start gap-0 hover:underline underline-offset-2">
              <span className="truncate text-[13.5px] font-semibold text-ink">
                {r.webName}
                {flagged && <span title={r.news ?? statusLabel(r.status)} className={cx('ml-1.5 text-[10px] font-bold', r.status === 'd' ? 'text-warn' : 'text-bad')}>!</span>}
              </span>
              <span className="text-[11px] text-ink-3">{r.teamShortName}</span>
            </PlayerTrigger>
          </div>
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-[11.5px] font-semibold text-ink-3">
          {r.role === 'captain' ? (
            <span className="num inline-grid size-[18px] place-items-center rounded-full bg-good text-[10px] font-extrabold text-canvas">C</span>
          ) : r.role === 'vice' ? (
            <span className="num inline-grid size-[18px] place-items-center rounded-full bg-surface-3 text-[10px] font-extrabold text-ink">V</span>
          ) : r.role === 'starter' ? (
            'XI'
          ) : (
            `Bench ${r.benchOrder ?? ''}`
          )}
          {!isModels && ((r.slot <= 11) !== (r.role !== 'bench')) && (
            <span className="ml-1.5 text-warn" title={r.slot <= 11 ? 'You start this player; the model would bench him' : 'You bench this player; the model would start him'}>
              · you {r.slot <= 11 ? 'start' : 'bench'}
            </span>
          )}
        </td>
        <td className="num px-3 py-2 text-right text-[13px] text-ink-2">{money(r.nowCost).replace('£', '').replace('m', '')}</td>
        <td className={cx('num px-3 py-2 text-right text-[13px]', r.plays !== null && r.plays < 0.8 ? 'font-bold text-warn' : 'text-ink-2')}>{r.plays === null ? '—' : percent(r.plays)}</td>
        {r.cells.map((c) => (
          <td key={c.gameweekId} className="px-3 py-2 text-right">
            <div className="flex flex-col items-end gap-[3px]">
              <span className={cx('num text-[15px] font-bold', c.ep === null ? 'text-ink-3' : 'text-ink')}>{c.ep === null ? '—' : points(c.ep)}</span>
              <span className="flex gap-0.5">
                {c.fixtures.length === 0 ? <BlankTag size="sm" /> : c.fixtures.map((f, i) => <FixtureTag key={i} opponent={f.opponentShortName} isHome={f.isHome} difficulty={f.difficulty} size="sm" />)}
              </span>
            </div>
          </td>
        ))}
        <td className="num px-3 py-2 text-right text-base font-extrabold text-ink">{r.sum === null ? '—' : points(r.sum)}</td>
        <td className="px-3 py-2 text-right text-xs">
          {r.inBest ? <span className="text-ink-3">in it</span> : <span className="font-semibold text-bad">not in it</span>}
        </td>
      </tr>
    </>
  );
}
