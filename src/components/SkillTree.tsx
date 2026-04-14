import { useMemo, useState } from 'react';
import dagre from 'dagre';
import {
  Background,
  BaseEdge,
  Controls,
  Handle,
  Position,
  ReactFlow,
  getBezierPath,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

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
  summary:
    'AI and ML leader with a systems mindset, an educator’s instinct for clarity, and an economics-rooted way of thinking about decisions, tradeoffs, and impact.',
};

const nodeDimensions = {
  root: { width: 220, height: 94 },
  branch: { width: 180, height: 58 },
  node: { width: 220, height: 96 },
};

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
          minWidth: isRoot ? 200 : isBranch ? 170 : 210,
          maxWidth: isRoot ? 220 : isBranch ? 190 : 220,
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

function SoftEdge({ id, sourceX, sourceY, targetX, targetY, style }: EdgeProps) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    curvature: 0.24,
  });

  return <BaseEdge id={id} path={path} style={style} />;
}

const nodeTypes = { card: GraphCardNode };
const edgeTypes = { soft: SoftEdge };

function buildLayout(data: TreeData, activeId: string, onSelect: (id: string) => void) {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: 'TB',
    nodesep: 72,
    ranksep: 88,
    marginx: 80,
    marginy: 60,
  });

  const branchIds = new Set(data.branches.map((branch) => branch.id));
  const hierarchicalLinks = data.links.filter((link) => link.from === 'root' || !branchIds.has(link.to));
  const contextualLinks = data.links.filter((link) => branchIds.has(link.from) && branchIds.has(link.to));

  graph.setNode(root.id, { ...nodeDimensions.root });

  data.branches.forEach((branch) => {
    graph.setNode(branch.id, { ...nodeDimensions.branch });
  });

  data.nodes.forEach((node) => {
    graph.setNode(node.id, { ...nodeDimensions.node });
  });

  hierarchicalLinks.forEach((link) => {
    graph.setEdge(link.from, link.to);
  });

  dagre.layout(graph);

  const positions = new Map<string, { x: number; y: number }>();
  positions.set(root.id, { ...graph.node(root.id) });
  data.branches.forEach((branch) => positions.set(branch.id, { ...graph.node(branch.id) }));
  data.nodes.forEach((node) => positions.set(node.id, { ...graph.node(node.id) }));

  const rootPos = positions.get(root.id)!;
  positions.set(root.id, { ...rootPos, y: rootPos.y + 42 });
  positions.set('ai-ml', { x: rootPos.x - 185, y: rootPos.y - 88 });
  positions.set('leadership', { x: rootPos.x + 45, y: rootPos.y - 88 });
  positions.set('better-collective', { x: rootPos.x - 320, y: rootPos.y + 2 });
  positions.set('agents', { x: rootPos.x - 155, y: rootPos.y + 10 });
  positions.set('governance', { x: rootPos.x - 295, y: rootPos.y + 118 });
  positions.set('team-leadership', { x: rootPos.x - 5, y: rootPos.y + 4 });
  positions.set('amauta', { x: rootPos.x + 150, y: rootPos.y + 8 });

  const nodes: Node<GraphNodeData>[] = [
    {
      id: root.id,
      type: 'card',
      position: positions.get(root.id)!,
      draggable: false,
      data: {
        id: root.id,
        label: root.label,
        kind: 'root',
        color: '#7abdfd',
        active: activeId === root.id,
        onSelect,
      },
    },
    ...data.branches.map((branch) => ({
      id: branch.id,
      type: 'card',
      position: positions.get(branch.id)!,
      draggable: false,
      data: {
        id: branch.id,
        label: branch.label,
        kind: 'branch' as const,
        color: colorMap[branch.color],
        active: activeId === branch.id,
        onSelect,
      },
    })),
    ...data.nodes.map((node) => {
      const branch = data.branches.find((item) => item.id === node.branch);
      return {
        id: node.id,
        type: 'card',
        position: positions.get(node.id)!,
        draggable: false,
        data: {
          id: node.id,
          label: node.label,
          kind: 'node' as const,
          color: colorMap[branch?.color ?? 'blue'],
          tags: node.tags,
          active: activeId === node.id,
          onSelect,
        },
      };
    }),
  ];

  const edges: Edge[] = [
    ...hierarchicalLinks.map((link) => {
      const isRootLink = link.from === 'root';
      return {
        id: `${link.from}-${link.to}`,
        source: link.from,
        target: link.to,
        type: 'soft',
        selectable: false,
        style: {
          stroke: isRootLink ? 'rgba(143, 192, 255, 0.95)' : 'rgba(115, 184, 255, 0.92)',
          strokeWidth: isRootLink ? 2.4 : 1.8,
          opacity: 0.96,
        },
      } satisfies Edge;
    }),
    ...contextualLinks.map((link) => ({
      id: `${link.from}-${link.to}`,
      source: link.from,
      target: link.to,
      type: 'soft',
      selectable: false,
      hidden: activeId === 'root' || !(link.from === activeId || link.to === activeId),
      style: {
        stroke: 'rgba(255,255,255,0.16)',
        strokeWidth: 1.1,
        opacity: 0.75,
      },
    } satisfies Edge)),
  ];

  return { nodes, edges };
}

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

  const { nodes, edges } = useMemo(() => buildLayout(data, activeId, setActiveId), [data, activeId]);

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
              <div className="mt-1 text-sm text-slate-300">A structured graph with lightweight contextual links</div>
            </div>
            <div className="text-xs text-slate-400">Drag, zoom, and click nodes to inspect them</div>
          </div>

          <div className="h-[820px]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              nodeOrigin={[0.5, 0.5]}
              fitView
              fitViewOptions={{ padding: 0.18, minZoom: 0.72 }}
              minZoom={0.55}
              maxZoom={1.35}
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
              elementsSelectable={false}
              zoomOnDoubleClick={false}
              panOnDrag
              className="bg-transparent"
              defaultEdgeOptions={{ type: 'soft' }}
            >
              <Background color="rgba(255,255,255,0.05)" gap={26} size={1} />
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
