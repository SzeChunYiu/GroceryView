export type UxPersona = {
  id: string;
  name: string;
  goals: string[];
  notes?: string[];
  locale?: string;
  device?: 'mobile' | 'desktop';
};

export type UxTaskStep =
  | { id: string; action: 'goto'; url: string }
  | { id: string; action: 'click'; selector: string }
  | { id: string; action: 'fill'; selector: string; value: string }
  | { id: string; action: 'expectText'; text: string }
  | { id: string; action: 'note'; note: string; severity?: UxFrictionSeverity };

export type UxTaskScript = {
  id: string;
  title: string;
  steps: UxTaskStep[];
};

export type UxFrictionSeverity = 'low' | 'medium' | 'high';

export type UxFrictionNote = {
  personaId: string;
  taskId: string;
  stepId: string;
  severity: UxFrictionSeverity;
  note: string;
  url?: string;
};

export type UxRunResult = {
  personaId: string;
  taskId: string;
  status: 'completed' | 'failed';
  friction: UxFrictionNote[];
};

export type PlaywrightLikePage = {
  goto(url: string): Promise<unknown>;
  click(selector: string): Promise<unknown>;
  fill(selector: string, value: string): Promise<unknown>;
  textContent(selector: string): Promise<string | null>;
  url(): string;
};

export type UxSimulationPageFactory = (persona: UxPersona, task: UxTaskScript) => Promise<PlaywrightLikePage> | PlaywrightLikePage;

async function runStep(page: PlaywrightLikePage, persona: UxPersona, task: UxTaskScript, step: UxTaskStep): Promise<UxFrictionNote[]> {
  if (step.action === 'goto') {
    await page.goto(step.url);
    return [];
  }
  if (step.action === 'click') {
    await page.click(step.selector);
    return [];
  }
  if (step.action === 'fill') {
    await page.fill(step.selector, step.value);
    return [];
  }
  if (step.action === 'expectText') {
    const body = await page.textContent('body');
    return body?.includes(step.text) ? [] : [{ personaId: persona.id, taskId: task.id, stepId: step.id, severity: 'high', note: `Expected text not found: ${step.text}`, url: page.url() }];
  }
  return [{ personaId: persona.id, taskId: task.id, stepId: step.id, severity: step.severity ?? 'medium', note: step.note, url: page.url() }];
}

export async function runUxSimulation(input: {
  personas: UxPersona[];
  tasks: UxTaskScript[];
  pageFactory: UxSimulationPageFactory;
}): Promise<UxRunResult[]> {
  const results: UxRunResult[] = [];
  for (const persona of input.personas) {
    for (const task of input.tasks) {
      const page = await input.pageFactory(persona, task);
      const friction: UxFrictionNote[] = [];
      let status: UxRunResult['status'] = 'completed';
      for (const step of task.steps) {
        try {
          friction.push(...await runStep(page, persona, task, step));
        } catch (error) {
          status = 'failed';
          friction.push({ personaId: persona.id, taskId: task.id, stepId: step.id, severity: 'high', note: error instanceof Error ? error.message : 'Step failed', url: page.url() });
          break;
        }
      }
      results.push({ personaId: persona.id, taskId: task.id, status, friction });
    }
  }
  return results;
}
