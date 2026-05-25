export type UxSeverity = 'info' | 'minor' | 'major' | 'blocker';

export type UxPersona = {
  id: string;
  name?: string;
  label?: string;
  goals?: readonly string[];
  dealbreakers?: readonly string[];
  typicalSession?: unknown;
};

export type UxTaskStepContext = {
  page: UxPage;
  persona: UxPersona;
  task: UxTask;
  note: (message: string, severity?: UxSeverity) => void;
};

export type UxTask = {
  id: string;
  label: string;
  entryPath: string;
  successSignals: readonly string[];
  steps: readonly ((context: UxTaskStepContext) => Promise<void> | void)[];
};

export type UxPage = {
  goto: (url: string) => Promise<unknown>;
  title?: () => Promise<string>;
  url?: () => string;
};

export type UxBrowser = {
  newPage: () => Promise<UxPage>;
  close?: () => Promise<void>;
};

export type UxBrowserFactory = () => Promise<UxBrowser>;

export type UxFrictionLogEntry = {
  personaId: string;
  personaLabel: string;
  taskId: string;
  taskLabel: string;
  severity: UxSeverity;
  notes: string[];
  evidence: {
    startUrl: string;
    finalUrl: string;
    pageTitle: string;
    successSignals: readonly string[];
  };
};

const severityRank: Record<UxSeverity, number> = { info: 0, minor: 1, major: 2, blocker: 3 };

function maxSeverity(left: UxSeverity, right: UxSeverity): UxSeverity {
  return severityRank[right] > severityRank[left] ? right : left;
}

export async function runUxSimulation(input: {
  personas: readonly UxPersona[];
  tasks: readonly UxTask[];
  browserFactory: UxBrowserFactory;
  baseUrl?: string;
}): Promise<UxFrictionLogEntry[]> {
  const logs: UxFrictionLogEntry[] = [];

  for (const persona of input.personas) {
    for (const task of input.tasks) {
      const browser = await input.browserFactory();
      const page = await browser.newPage();
      const notes: string[] = [];
      let severity: UxSeverity = 'info';
      const startUrl = new URL(task.entryPath, input.baseUrl ?? 'http://localhost:3000').toString();

      const note = (message: string, nextSeverity: UxSeverity = 'minor') => {
        notes.push(message);
        severity = maxSeverity(severity, nextSeverity);
      };

      try {
        await page.goto(startUrl);
        for (const step of task.steps) await step({ page, persona, task, note });
        if (notes.length === 0) notes.push('No persona friction was recorded for the scripted path.');
      } catch (error) {
        note(error instanceof Error ? error.message : 'Unknown UX simulation error', 'blocker');
      } finally {
        logs.push({
          personaId: persona.id,
          personaLabel: persona.name ?? persona.label ?? persona.id,
          taskId: task.id,
          taskLabel: task.label,
          severity,
          notes,
          evidence: {
            startUrl,
            finalUrl: page.url?.() ?? startUrl,
            pageTitle: page.title ? await page.title().catch(() => '') : '',
            successSignals: task.successSignals
          }
        });
        await browser.close?.();
      }
    }
  }

  return logs;
}
