import { useMemo, useState } from 'react';

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
};

export default function SkillTree({ data }: { data: TreeData }) {
  const [activeId, setActiveId] = useState<string>('ml');

  const entities = useMemo(() => {
    const branchEntries = data.branches.map((branch) => [branch.id, branch]);
    const nodeEntries = data.nodes.map((node) => [node.id, node]);
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

  return (
    <section id="skill-tree" className="shell pb-10 md:pb-14">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.28em] text-sky-200/70">Interactive map</p>
        <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">A skill tree with graph-style connective tissue</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
          Click branches and nodes to explore. The structure is content-driven, so the site can grow as your work grows.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.75fr]">
        <div className="panel glow relative min-h-[620px] overflow-hidden rounded-[32px] p-4 md:p-6">
          <div className="absolute inset-0 opacity-40" aria-hidden="true">
            <div className="absolute left-[12%] top-[14%] h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="absolute right-[14%] top-[20%] h-36 w-36 rounded-full bg-fuchsia-400/10 blur-3xl" />
            <div className="absolute bottom-[12%] left-[30%] h-44 w-44 rounded-full bg-emerald-400/10 blur-3xl" />
          </div>

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
                  stroke={isActive ? 'rgba(122, 189, 255, 0.9)' : 'rgba(255, 255, 255, 0.12)'}
                  strokeWidth={isActive ? 0.45 : 0.22}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          <button
            type="button"
            onClick={() => setActiveId('root')}
            className="absolute left-[50%] top-[48%] z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/40 bg-slate-950/90 px-5 py-4 text-center shadow-[0_0_30px_rgba(90,178,255,0.22)] transition hover:border-sky-200 hover:bg-slate-900"
          >
            <div className="text-xs uppercase tracking-[0.25em] text-sky-200/80">Root</div>
            <div className="mt-1 text-sm font-semibold text-white md:text-base">Pablo Romero</div>
          </button>

          {data.branches.map((branch) => {
            const active = activeId === branch.id;
            const connected = connectedIds.has(branch.id);
            return (
              <button
                key={branch.id}
                type="button"
                onClick={() => setActiveId(branch.id)}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border px-4 py-3 text-sm font-medium transition"
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
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-3 py-2 text-left text-xs transition md:text-sm"
                style={{
                  left: `${node.position.x}%`,
                  top: `${node.position.y}%`,
                  width: 'min(180px, 32vw)',
                  borderColor: active || connected ? color : 'rgba(255,255,255,0.12)',
                  background: active ? 'rgba(14, 25, 44, 0.96)' : 'rgba(14, 25, 44, 0.74)',
                  boxShadow: active ? `0 0 24px ${color}2e` : 'none',
                  color: '#e5eefc',
                }}
              >
                <div className="font-medium">{node.label}</div>
                <div className="mt-1 text-[11px] text-slate-400 md:text-xs">{node.tags.slice(0, 2).join(' • ')}</div>
              </button>
            );
          })}
        </div>

        <aside className="panel rounded-[32px] p-6 md:p-7">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Selected node</div>
          <h3 className="mt-3 text-2xl font-semibold text-white">{activeEntity.label}</h3>
          <div className="mt-3 h-1.5 w-20 rounded-full" style={{ background: activeBranchColor }} />
          <p className="mt-5 text-sm leading-7 text-slate-300">
            {'summary' in activeEntity
              ? activeEntity.summary
              : 'The central identity branch of the site. This is where the narrative starts, then fans out into technical depth, leadership, teaching, and communication.'}
          </p>

          {'tags' in activeEntity && (
            <div className="mt-6 flex flex-wrap gap-2">
              {activeEntity.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Implementation note</div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              This component is driven by YAML data, so adding a new branch or project node is mostly a content edit, not a UI rewrite.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
