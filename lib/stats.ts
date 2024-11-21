import { stringifySvg } from './stringifier.js';
import type { StringifyOptions, Visitor, XastRoot } from './types.js';
import { visit } from './xast.js';

type Step = {
  plugin: string;
  size: {
    before: number;
    after: number;
  };
  time: number;
};

export type StatsSummary = {
  multipassCount: number;
  steps: Step[];
  perPlugin: Record<string, { diff: number; time: number }>;
  time: number;
  diff: number;
};

export class Stats {
  private readonly steps: Step[];
  private multipassCount = 0;

  constructor(input: string, ast: XastRoot) {
    const start = performance.now();
    const before = input.length;
    const after = stringifySvg(ast).length;
    const end = performance.now();
    this.steps = [
      { plugin: 'stringify', size: { before, after }, time: end - start },
    ];
  }

  incrementPasses() {
    this.multipassCount++;
  }

  visit(ast: XastRoot, visitor: Visitor, plugin: { name: string }) {
    const start = performance.now();
    const before = stringifySvg(ast).length;
    visit(ast, visitor);
    const after = stringifySvg(ast).length;
    const end = performance.now();
    this.steps.push({
      plugin: plugin.name,
      size: { before, after },
      time: end - start,
    });
  }

  stringify(ast: XastRoot, config?: StringifyOptions) {
    const start = performance.now();
    const before = stringifySvg(ast).length;
    const result = stringifySvg(ast, config);
    const after = result.length;
    const end = performance.now();
    this.steps.push({
      plugin: 'stringify',
      size: { before, after },
      time: end - start,
    });
    return result;
  }

  getStatsSummary(): StatsSummary {
    const perPlugin = this.perPlugin();
    const time = this.steps.reduce((acc, step) => acc + step.time, 0);
    const diff = Object.values(perPlugin).reduce((a, { diff }) => a + diff, 0);
    return {
      multipassCount: this.multipassCount,
      steps: this.steps,
      perPlugin,
      time,
      diff,
    };
  }

  private perPlugin() {
    const r: Record<string, { diff: number; time: number }> = {};
    for (const step of this.steps)
      r[step.plugin] = {
        diff: (r[step.plugin]?.diff ?? 0) + step.size.after - step.size.before,
        time: (r[step.plugin]?.time ?? 0) + step.time,
      };
    return r;
  }
}
