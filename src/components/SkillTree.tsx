import { useMemo, useState } from 'react';

type Branch = {
  id: string;
  label: string;
  color: string;
  position: { x: number; y: number };
};

type TreeNode = {
  id: string;
  branch: string;
  label: string;
  position: { x: number; y: number };
  summary: string;
  tags: string[];
};

type Link = {
  from: string;
  to: string;
};

type TreeData = {
  branches: Branch[];
  nodes: TreeNode[];
  links: Link[];
};

type LayoutNode = {
  id: string;
  label: string;
  kind: 'root' | 'branch' | 'node';
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tags?: string[];
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
  summary:
    'AI and ML leader with a systems mindset, an educator’s instinct for clarity, and an economics-rooted way of thinking about decisions, tradeoffs, and impact.',
};

const branchSummaries: Record<string, string> = {
  'ai-ml': 'Applied machine learning leadership across model portfolios, agent workflows, evaluation systems, and production-grade governance.',
  leadership: 'Building teams, mentoring across disciplines, and carrying technical work into organizational execution and long-term capability.',
  teaching: 'Teaching is part of the operating system here, turning complexity into clarity and helping people grow real confidence.',
  architecture: 'Hands-on systems thinking across cloud platforms, MLOps, automation, and the infrastructure that makes ML useful in practice.',
  strategy: 'An economics-rooted way of thinking about incentives, tradeoffs, and organizational direction, now deepened through management study.',
};

const FRAME = {
  width: 1160,
  height: 860,
};

const ROOT_LAYOUT = {
  x: 580,
  y: 420,
  width: 256,
  height: 106,
};

const BRANCH_LAYOUTS: Record<string, { x: number; y: number; width: number; height: number }> = {
  'ai-ml': { x: 580, y: 176, width: 190, height: 58 },
  leadership: { x: 816, y: 304, width: 190, height: 58 },
  teaching: { x: 816, y: 576, width: 190, height: 58 },
  strategy: { x: 580, y: 704, width: 210, height: 58 },
  architecture: { x: 344, y: 576, width: 220, height: 58 },
};

const NODE_LAYOUTS: Record<string, { x: number; y: number; width: number; height: number }> = {
  'better-collective': { x: 422, y: 94, width: 220, height: 96 },
  agents: { x: 580, y: 58, width: 220, height: 96 },
  governance: { x: 738, y: 94, width: 220, height: 96 },
  'team-leadership': { x: 958, y: 246, width: 220, height: 96 },
  amauta: { x: 958, y: 372, width: 220, height: 96 },
  unc: { x: 958, y: 512, width: 220, height: 96 },
  explanation: { x: 958, y: 638, width: 220, height: 96 },
  economist: { x: 422, y: 824, width: 220, height: 96 },
  'management-master': { x: 738, y: 824, width: 220, height: 96 },
  cloud: { x: 202, y: 512, width: 220, height: 96 },
  symplast: { x: 202, y: 638, width: 220, height: 96 },
};

function edgePath(source: LayoutNode, target: LayoutNode, mode: 'hierarchy' | 'context') {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.hypot(dx, dy) || 1;
  const ux = dx / distance;
  const uy = dy / distance;
  const startX = source.x + ux * (source.width / 2);
  const startY = source.y + uy * (source.height / 2);
  const endX = target.x - ux * (target.width / 2);
  const endY = target.y - uy * (target.height / 2);
  const bend = mode === 'context' ? 0.12 : 0.18;
  const c1x = startX + dx * 0.28 - dy * bend;
  const c1y = startY + dy * 0.28 + dx * bend;
  const c2x = endX - dx * 0.28 - dy * bend;
  const c2y = endY - dy * 0.28 + dx * bend;

  return `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;
}

function DesktopGraphCard({
  node,
  active,
  onSelect,
}: {
  node: LayoutNode;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const isRoot = node.kind === 'root';
  const isBranch = node.kind === 'branch';

  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      className="absolute border text-left transition duration-300"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        minHeight: node.height,
        transform: 'translate(-50%, -50%)',
        borderColor: active ? node.color : 'rgba(255,255,255,0.12)',
        background: active ? 'rgba(11, 21, 37, 0.98)' : 'rgba(10, 18, 32, 0.82)',
        boxShadow: active
          ? `0 18px 60px ${node.color}25, inset 0 0 0 1px ${node.color}22`
          : '0 12px 40px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.03)',
        color: '#edf4ff',
        borderRadius: isRoot ? 30 : isBranch ? 999 : 24,
        padding: isRoot ? '20px 22px' : isBranch ? '12px 18px' : '14px 16px',
        zIndex: active ? 5 : isRoot ? 4 : isBranch ? 3 : 2,
      }}
    >
      {isRoot && <div className="text-[11px] uppercase tracking-[0.3em] text-sky-200/70">Root</div>}
      <div className={`font-semibold ${isRoot ? 'mt-1 text-xl' : isBranch ? 'text-sm' : 'text-base'}`}>{node.label}</div>
      {!isBranch && node.tags && node.tags.length > 0 && (
        <div className="mt-2 text-xs text-slate-400">{node.tags.slice(0, 2).join(' • ')}</div>
      )}
    </button>
  );
}

function buildDesktopLayout(data: TreeData) {
  const branchById = new Map(data.branches.map((branch) => [branch.id, branch] as const));

  const nodes: LayoutNode[] = [
    {
      id: root.id,
      label: root.label,
      kind: 'root',
      color: '#7abdfd',
      ...ROOT_LAYOUT,
    },
    ...data.branches.map((branch) => ({
      id: branch.id,
      label: branch.label,
      kind: 'branch' as const,
      color: colorMap[branch.color],
      ...(BRANCH_LAYOUTS[branch.id] ?? {
        x: branch.position.x * 11,
        y: branch.position.y * 8,
        width: 190,
        height: 58,
      }),
    })),
    ...data.nodes.map((node) => {
      const branch = branchById.get(node.branch);
      return {
        id: node.id,
        label: node.label,
        kind: 'node' as const,
        color: colorMap[branch?.color ?? 'blue'],
        tags: node.tags,
        ...(NODE_LAYOUTS[node.id] ?? {
          x: node.position.x * 11,
          y: node.position.y * 8,
          width: 220,
          height: 96,
        }),
      };
    }),
  ];

  const byId = new Map(nodes.map((node) => [node.id, node] as const));
  const branchIds = new Set(data.branches.map((branch) => branch.id));

  const hierarchyLinks = data.links.filter((link) => link.from === 'root' || !branchIds.has(link.to));
  const contextLinks = data.links.filter((link) => branchIds.has(link.from) && branchIds.has(link.to));

  return {
    nodes,
    byId,
    hierarchyLinks,
    contextLinks,
  };
}

export default function SkillTree({ data }: { data: TreeData }) {
  const [activeId, setActiveId] = useState<string>('root');
  const [mobileBranchId, setMobileBranchId] = useState<string>(data.branches[0]?.id ?? '');

  const entities = useMemo(() => {
    const branchEntries = data.branches.map((branch) => [branch.id, branch] as const);
    const nodeEntries = data.nodes.map((node) => [node.id, node] as const);
    return new Map<string, Branch | TreeNode | typeof root>([['root', root], ...branchEntries, ...nodeEntries]);
  }, [data]);

  const desktopGraph = useMemo(() => buildDesktopLayout(data), [data]);

  const activeEntity = entities.get(activeId) ?? root;
  const activeBranchColor =
    'branch' in activeEntity
      ? colorMap[data.branches.find((branch) => branch.id === activeEntity.branch)?.color ?? 'blue']
      : colorMap[(activeEntity as Branch).color ?? 'blue'] ?? '#5ab2ff';
  const activeSummary =
    activeId === 'root'
      ? root.summary
      : data.branches.some((branch) => branch.id === activeId)
        ? branchSummaries[activeId] ?? root.summary
        : 'summary' in activeEntity
          ? activeEntity.summary
          : root.summary;

  const mobileBranch = data.branches.find((branch) => branch.id === mobileBranchId) ?? data.branches[0];
  const mobileNodes = data.nodes.filter((node) => node.branch === mobileBranch?.id);

  const activeBranchId =
    activeId === 'root'
      ? null
      : data.branches.some((branch) => branch.id === activeId)
        ? activeId
        : data.nodes.find((node) => node.id === activeId)?.branch ?? null;

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

        <div className="panel glow hidden overflow-hidden rounded-[32px] md:block">
          <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Desktop view</div>
              <div className="mt-1 text-sm text-slate-300">A custom-rendered skill map with intentionally designed composition</div>
            </div>
            <div className="text-xs text-slate-400">Click nodes to inspect them</div>
          </div>

          <div className="relative h-[860px] overflow-hidden bg-[radial-gradient(circle_at_center,rgba(90,178,255,0.12),transparent_24%),radial-gradient(circle_at_top,rgba(90,178,255,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(182,144,255,0.07),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.015),rgba(255,255,255,0.01))]">
            <svg viewBox={`0 0 ${FRAME.width} ${FRAME.height}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
              <defs>
                <filter id="soft-glow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="10" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {desktopGraph.hierarchyLinks.map((link) => {
                const source = desktopGraph.byId.get(link.from);
                const target = desktopGraph.byId.get(link.to);
                if (!source || !target) return null;
                const branchColor = target.kind === 'branch' ? target.color : source.color;
                const active = activeId === 'root' || activeId === link.from || activeId === link.to || activeBranchId === link.from;

                return (
                  <path
                    key={link.from + link.to}
                    d={edgePath(source, target, 'hierarchy')}
                    fill="none"
                    stroke={branchColor}
                    strokeOpacity={active ? 0.55 : 0.2}
                    strokeWidth={active ? 2.4 : 1.5}
                    filter={active ? 'url(#soft-glow)' : undefined}
                  />
                );
              })}

              {desktopGraph.contextLinks.map((link) => {
                const source = desktopGraph.byId.get(link.from);
                const target = desktopGraph.byId.get(link.to);
                if (!source || !target) return null;
                const visible = activeBranchId !== null && (link.from === activeBranchId || link.to === activeBranchId || link.from === activeId || link.to === activeId);
                if (!visible) return null;

                return (
                  <path
                    key={link.from + link.to}
                    d={edgePath(source, target, 'context')}
                    fill="none"
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth={1.15}
                    strokeDasharray="5 8"
                  />
                );
              })}
            </svg>

            <div className="absolute inset-0">
              {desktopGraph.nodes.map((node) => (
                <DesktopGraphCard
                  key={node.id}
                  node={node}
                  active={activeId === node.id}
                  onSelect={setActiveId}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="panel rounded-[32px] p-6 md:p-7">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Focus</div>
          <h3 className="mt-3 text-2xl font-semibold text-white">{activeEntity.label}</h3>
          <div className="mt-3 h-1.5 w-20 rounded-full" style={{ background: activeBranchColor }} />
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">{activeSummary}</p>

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
