import { useMemo, useState } from 'react';
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

type Point = { x: number; y: number };

type Branch = {
  id: string;
  label: string;
  color: string;
  position: Point;
};

type TreeNode = {
  id: string;
  branch: string;
  label: string;
  position: Point;
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

type GraphNodeData = {
  label: string;
  kind: 'root' | 'branch' | 'node';
  color: string;
  tags?: string[];
  active?: boolean;
  onSelect: (id: string) => void;
  id: string;
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

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 760;

function GraphCardNode({ data }: NodeProps<Node<GraphNodeData>>) {
  const isRoot = data.kind === 'root';
  const isBranch = data.kind === 'branch';

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <button
        type="button"
        onClick={() => data.onSelect(data.id)}
        className="rounded-2xl border text-left transition"
        style={{
          minWidth: isRoot ? 190 : isBranch ? 160 : 190,
          maxWidth: isRoot ? 220 : 210,
          padding: isRoot ? '18px 20px' : isBranch ? '12px 18px' : '14px 16px',
          borderColor: data.active ? data.color : 'rgba(255,255,255,0.14)',
          background: data.active ? 'rgba(13, 23, 40, 0.98)' : 'rgba(13, 23, 40, 0.82)',
          boxShadow: data.active ? `0 0 26px ${data.color}2e` : '0 0 0 1px rgba(255,255,255,0.03)',
          color: '#edf4ff',
          borderRadius: isRoot ? 28 : isBranch ? 999 : 20,
        }}
      >
        {isRoot && <div className="text-[11px] uppercase tracking-[0.3em] text-sky-200/70">Root</div>}
        <div className={`font-semibold ${isRoot ? 'mt-1 text-xl' : isBranch ? 'text-sm' : 'text-base'}`}>{data.label}</div>
        {!isBranch && data.tags && data.tags.length > 0 && (
          <div className="mt-2 text-xs text-slate-400">{data.tags.slice(0, 2).join(' • ')}</div>
        )}
      </button>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </>
  );
}

const nodeTypes = { card: GraphCardNode };

export default function SkillTree({ data }: { data: TreeData }) {
  const [activeId, setActiveId] = useState<string>('root');
  const [mobileBranchId, setMobileBranchId] = useState<string>(data.branches[0]?.id ?? '');

  const entities = useMemo(() => {
    const branchEntries = data.branches.map((branch) => [branch.id, branch] as const);
    const nodeEntries = data.nodes.map((node) => [node.id, node] as const);
    return new Map<string, Branch | TreeNode | typeof root>([['root', root], ...branchEntries, ...nodeEntries]);
  }, [data]);

  const activeEntity = entities.get(activeId) ?? root;
  const activeBranchColor =
    'branch' in activeEntity
      ? colorMap[data.branches.find((branch) => branch.id === activeEntity.branch)?.color ?? 'blue']
      : colorMap[(activeEntity as Branch).color ?? 'blue'] ?? '#5ab2ff';

  const mobileBranch = data.branches.find((branch) => branch.id === mobileBranchId) ?? data.branches[0];
  const mobileNodes = data.nodes.filter((node) => node.branch === mobileBranch?.id);

  const graphNodes = useMemo<Node<GraphNodeData>[]>(() => {
    const percentToCanvas = (position: Point) => ({
      x: (position.x / 100) * CANVAS_WIDTH,
      y: (position.y / 100) * CANVAS_HEIGHT,
    });

    const branchNodes = data.branches.map((branch) => ({
      id: branch.id,
      type: 'card',
      position: percentToCanvas(branch.position),
      draggable: false,
      data: {
        id: branch.id,
        label: branch.label,
        kind: 'branch' as const,
        color: colorMap[branch.color],
        active: activeId === branch.id,
        onSelect: setActiveId,
      },
    }));

    const childNodes = data.nodes.map((node) => {
      const branch = data.branches.find((item) => item.id === node.branch);
      return {
        id: node.id,
        type: 'card',
        position: percentToCanvas(node.position),
        draggable: false,
        data: {
          id: node.id,
          label: node.label,
          kind: 'node' as const,
          color: colorMap[branch?.color ?? 'blue'],
          tags: node.tags,
          active: activeId === node.id,
          onSelect: setActiveId,
        },
      };
    });

    return [
      {
        id: root.id,
        type: 'card',
        position: percentToCanvas(root.position),
        draggable: false,
        data: {
          id: root.id,
          label: root.label,
          kind: 'root' as const,
          color: '#7abdfd',
          active: activeId === 'root',
          onSelect: setActiveId,
        },
      },
      ...branchNodes,
      ...childNodes,
    ];
  }, [activeId, data.branches, data.nodes]);

  const graphEdges = useMemo<Edge[]>(() => {
    const branchIds = new Set(data.branches.map((branch) => branch.id));

    return data.links.map((link) => {
      const isRootLink = link.from === 'root';
      const isBranchToNode = branchIds.has(link.from) && !branchIds.has(link.to);
      const isCrossBranch = branchIds.has(link.from) && branchIds.has(link.to);

      const stroke = isRootLink
        ? 'rgba(143, 192, 255, 0.95)'
        : isBranchToNode
          ? 'rgba(115, 184, 255, 0.9)'
          : 'rgba(255,255,255,0.18)';

      return {
        id: `${link.from}-${link.to}`,
        source: link.from,
        target: link.to,
        type: 'smoothstep',
        animated: false,
        selectable: false,
        style: {
          stroke,
          strokeWidth: isRootLink ? 2.2 : isBranchToNode ? 1.7 : 1.1,
          opacity: isCrossBranch ? 0.8 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: stroke,
          width: isCrossBranch ? 14 : 18,
          height: isCrossBranch ? 14 : 18,
        },
      } satisfies Edge;
    });
  }, [data.branches, data.links]);

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
              <div className="mt-1 text-sm text-slate-300">Drag, zoom, and click through the graph</div>
            </div>
            <div className="text-xs text-slate-400">Use the controls to reset or zoom</div>
          </div>

          <div className="h-[780px]">
            <ReactFlow
              nodes={graphNodes}
              edges={graphEdges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.16, minZoom: 0.72 }}
              minZoom={0.55}
              maxZoom={1.4}
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
              elementsSelectable={false}
              zoomOnDoubleClick={false}
              panOnDrag
              className="bg-transparent"
              defaultEdgeOptions={{ type: 'smoothstep' }}
            >
              <Background color="rgba(255,255,255,0.08)" gap={22} size={1} />
              <Controls showInteractive={false} position="bottom-right" />
            </ReactFlow>
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
