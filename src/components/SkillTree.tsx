import { useMemo, useRef, useState } from 'react';

type Position = { x: number; y: number };

type Branch = {
  id: string;
  label: string;
  color: string;
  position: Position;
};

type Node = {
  id: string;
  branch: string;
  label: string;
  position: Position;
  summary: string;
  tags: string[];
};

type Link = {
  from: string;
  to: string;
};

type TreeData = {
  branches: Branch[];
  nodes: Node[];
  links: Link[];
};

const colorMap: Record<string, string> = {
  blue: '#5ab2ff',
  gold: '#f7c46b',
  green: '#63d7b0',
  purple: '#b690ff',
  coral: '#ff9d8d',
};

const root = {
  id: 'root',
  label: 'Pablo Romero',
  position: { x: 50, y: 48 },
  summary:
    'AI and ML leader with a systems mindset, an educator’s instinct for clarity, and an economics-rooted way of thinking about decisions, tradeoffs, and impact.',
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function SkillTree({ data }: { data: TreeData }) {
  const [activeId, setActiveId] = useState<string>('root');
  const [mobileBranchId, setMobileBranchId] = useState<string>(data.branches[0]?.id ?? '');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);

  const entities = useMemo(() => {
    const branchEntries = data.branches.map((branch) => [branch.id, branch] as const);
    const nodeEntries = data.nodes.map((node) => [node.id, node] as const);
    return new Map<string, Branch | Node | typeof root>([['root', root], ...branchEntries, ...nodeEntries]);
  }, [data]);

  const activeEntity = entities.get(activeId) ?? root;
  const activeBranchColor =
    'branch' in activeEntity
      ? colorMap[data.branches.find((branch) => branch.id === activeEntity.branch)?.color ?? 'blue']
      : colorMap[(activeEntity as Branch).color ?? 'blue'] ?? '#5ab2ff';

  const connectedIds = new Set<string>(
    data.links
      .filter((link) => link.from === activeId || link.to === activeId)
      .flatMap((link) => [link.from, link.to]),
  );
  connectedIds.add(activeId);

  const getPosition = (id: string) => entities.get(id)?.position ?? root.position;
  const mobileBranch = data.branches.find((branch) => branch.id === mobileBranchId) ?? data.branches[0];
  const mobileNodes = data.nodes.filter((node) => node.branch === mobileBranch?.id);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;

    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      startX: offset.x,
      startY: offset.y,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const nextX = clamp(dragRef.current.startX + (event.clientX - dragRef.current.x), -90, 90);
    const nextY = clamp(dragRef.current.startY + (event.clientY - dragRef.current.y), -70, 70);
    setOffset({ x: nextX, y: nextY });
  };

  const endDrag = (event?: React.PointerEvent<HTMLDivElement>) => {
    if (event && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDragging(false);
  };

  return (
    <section id="skill-tree" className="shell pb-10 md:pb-14">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.28em] text-sky-200/70">Skills and strengths</p>
        <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">An interactive view of the work</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
          Explore the different parts of my background, from AI and systems to leadership, teaching, and strategy.
        </p>
      </div>

      <div className="space-y-6">
        <div className="panel glow rounded-[32px] p-5 md:hidden">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Explore</div>
              <div className="mt-2 text-lg font-semibold text-white">Browse by area</div>
            </div>
            <button
              type="button"
              onClick={() => setActiveId('root')}
              className="rounded-full border border-sky-300/30 px-3 py-1.5 text-xs font-medium text-sky-100"
            >
              Overview
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {data.branches.map((branch) => {
              const active = mobileBranch?.id === branch.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => {
                    setMobileBranchId(branch.id);
                    setActiveId(branch.id);
                  }}
                  className="rounded-full border px-3 py-2 text-sm font-medium transition"
                  style={{
                    borderColor: active ? colorMap[branch.color] : 'rgba(255,255,255,0.14)',
                    background: active ? 'rgba(8, 15, 28, 0.95)' : 'rgba(255,255,255,0.03)',
                    color: '#eff6ff',
                  }}
                >
                  {branch.label}
                </button>
              );
            })}
          </div>

          {mobileBranch && (
            <div className="mt-5 rounded-[24px] border border-white/10 bg-white/4 p-4">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorMap[mobileBranch.color] }} />
                <h3 className="text-lg font-semibold text-white">{mobileBranch.label}</h3>
              </div>
              <div className="mt-4 space-y-3">
                {mobileNodes.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setActiveId(node.id)}
                    className="block w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-left transition hover:border-white/20 hover:bg-white/6"
                  >
                    <div className="text-sm font-medium text-white">{node.label}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-300">{node.summary}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="panel glow relative hidden overflow-hidden rounded-[32px] md:block">
          <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Desktop view</div>
              <div className="mt-1 text-sm text-slate-300">Drag to explore the map</div>
            </div>
            <button
              type="button"
              onClick={() => setOffset({ x: 0, y: 0 })}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-300/40 hover:bg-white/5"
            >
              Reset view
            </button>
          </div>

          <div
            className="relative h-[760px] overflow-hidden"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            style={{ cursor: dragging ? 'grabbing' : 'grab' }}
          >
            <div className="absolute inset-0 opacity-40" aria-hidden="true">
              <div className="absolute left-[12%] top-[14%] h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />
              <div className="absolute right-[14%] top-[20%] h-36 w-36 rounded-full bg-fuchsia-400/10 blur-3xl" />
              <div className="absolute bottom-[12%] left-[30%] h-44 w-44 rounded-full bg-emerald-400/10 blur-3xl" />
            </div>

            <div
              className="absolute inset-0 select-none"
              style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(1.03)`, transformOrigin: 'center center' }}
            >
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                {data.links.map((link) => {
                  const from = getPosition(link.from);
                  const to = getPosition(link.to);
                  const isActive = connectedIds.has(link.from) && connectedIds.has(link.to);
                  return (
                    <line
                      key={`${link.from}-${link.to}`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={isActive ? 'rgba(122, 189, 255, 0.95)' : 'rgba(255, 255, 255, 0.12)'}
                      strokeWidth={isActive ? 0.4 : 0.2}
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>

              <button
                type="button"
                onClick={() => setActiveId('root')}
                className="absolute left-[50%] top-[48%] z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/40 bg-slate-950/90 px-6 py-5 text-center shadow-[0_0_30px_rgba(90,178,255,0.22)] transition hover:border-sky-200 hover:bg-slate-900"
              >
                <div className="text-xs uppercase tracking-[0.25em] text-sky-200/80">Root</div>
                <div className="mt-1 text-base font-semibold text-white">Pablo Romero</div>
              </button>

              {data.branches.map((branch) => {
                const active = activeId === branch.id;
                const connected = connectedIds.has(branch.id);
                return (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => setActiveId(branch.id)}
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border px-5 py-3 text-sm font-medium transition"
                    style={{
                      left: `${branch.position.x}%`,
                      top: `${branch.position.y}%`,
                      borderColor: active || connected ? colorMap[branch.color] : 'rgba(255,255,255,0.16)',
                      background: active || connected ? 'rgba(8, 15, 28, 0.95)' : 'rgba(8, 15, 28, 0.72)',
                      color: '#eff6ff',
                      boxShadow: active ? `0 0 24px ${colorMap[branch.color]}33` : 'none',
                    }}
                  >
                    {branch.label}
                  </button>
                );
              })}

              {data.nodes.map((node) => {
                const active = activeId === node.id;
                const connected = connectedIds.has(node.id);
                const branch = data.branches.find((item) => item.id === node.branch);
                const color = colorMap[branch?.color ?? 'blue'];
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setActiveId(node.id)}
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-4 py-3 text-left text-sm transition"
                    style={{
                      left: `${node.position.x}%`,
                      top: `${node.position.y}%`,
                      width: '190px',
                      borderColor: active || connected ? color : 'rgba(255,255,255,0.12)',
                      background: active ? 'rgba(14, 25, 44, 0.96)' : 'rgba(14, 25, 44, 0.76)',
                      boxShadow: active ? `0 0 24px ${color}2e` : 'none',
                      color: '#e5eefc',
                    }}
                  >
                    <div className="font-medium">{node.label}</div>
                    <div className="mt-1 text-xs text-slate-400">{node.tags.slice(0, 2).join(' • ')}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="panel rounded-[32px] p-6 md:p-7">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Focus</div>
          <h3 className="mt-3 text-2xl font-semibold text-white">{activeEntity.label}</h3>
          <div className="mt-3 h-1.5 w-20 rounded-full" style={{ background: activeBranchColor }} />
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
            {'summary' in activeEntity ? activeEntity.summary : root.summary}
          </p>

          {'tags' in activeEntity && Array.isArray(activeEntity.tags) && (
            <div className="mt-6 flex flex-wrap gap-2">
              {activeEntity.tags.map((tag: string) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
