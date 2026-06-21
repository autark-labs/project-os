import { CheckCircle2, HelpCircle, Info, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { poButtonClass } from '@/lib/projectOsStyleKit';
import { cn } from '@/lib/utils';
import type { MarketplaceApp } from '@/types/marketplace';
import {
  setupPreviewForApp,
  setupSchemaForApp,
  setupSummaryItems,
} from './extensions/MarketplacePage.setup';

type SetupAnswers = Record<string, unknown>;

type SetupInput = {
  id: string;
  label: string;
  type: string;
  group: 'required' | 'recommended' | 'app_specific' | 'advanced';
  required?: boolean;
  help?: string;
  options?: Array<{ value: string; label: string; description?: string }>;
  showWhen?: Record<string, string>;
};

type SetupPreview = {
  ready: boolean;
  blockers: Array<{ fieldId: string; message: string; severity: string }>;
  warnings: string[];
  sections: Record<'create' | 'connect' | 'protect' | 'check' | 'afterInstall', string[]>;
};

const GROUPS: Array<{ id: SetupInput['group']; label: string; description: string }> = [
  { id: 'required', label: 'Required', description: 'Name the app before Project OS prepares it.' },
  { id: 'recommended', label: 'Recommended', description: 'Good defaults for access, storage, and protection.' },
  { id: 'app_specific', label: 'App setup', description: 'Choices specific to this app.' },
  { id: 'advanced', label: 'Advanced', description: 'Use only when you need a specific local port.' },
];

export function MarketplaceSetupPanel({
  app,
  answers,
  onAnswersChange,
}: {
  app: MarketplaceApp;
  answers: SetupAnswers;
  onAnswersChange: (answers: SetupAnswers) => void;
}) {
  const schema = setupSchemaForApp(app) as { inputs: SetupInput[] };
  const preview = setupPreviewForApp(app, answers) as SetupPreview;

  function updateAnswer(fieldId: string, value: unknown) {
    onAnswersChange({ ...answers, [fieldId]: value });
  }

  return (
    <section className="grid gap-4 rounded-lg border border-slate-700/35 bg-slate-950/35 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge className="border-violet-300/25 bg-violet-500/10 text-violet-100" variant="outline">
            Guided setup
          </Badge>
          <h4 className="mt-3 font-bold text-white">Choose how {app.name} should start</h4>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Start with Project OS defaults, then change only the pieces that matter.
          </p>
        </div>
        <Badge className={preview.ready ? 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100' : 'border-amber-300/25 bg-amber-500/10 text-amber-100'} variant="outline">
          {preview.ready ? 'Ready to review' : 'Needs a choice'}
        </Badge>
      </div>

      <div className="grid gap-4">
        {GROUPS.map((group) => {
          const inputs = schema.inputs.filter((input: SetupInput) => input.group === group.id && shouldShowInput(input, answers));
          if (inputs.length === 0) {
            return null;
          }
          return (
            <div className="grid gap-3 rounded-lg border border-slate-700/30 bg-slate-900/45 p-3" key={group.id}>
              <div>
                <h5 className="text-sm font-bold text-white">{group.label}</h5>
                <p className="mt-1 text-xs leading-5 text-slate-500">{group.description}</p>
              </div>
              <div className="grid gap-3">
                {inputs.map((input: SetupInput) => (
                  <SetupField
                    input={input}
                    key={input.id}
                    problem={preview.blockers.find((blocker) => blocker.fieldId === input.id)}
                    value={answers[input.id]}
                    onChange={(value) => updateAnswer(input.id, value)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {preview.blockers.length > 0 && (
        <div className="rounded-lg border border-amber-300/25 bg-amber-500/10 p-3 text-sm text-amber-100">
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-200" />
            <div>
              <p className="font-semibold text-white">Finish setup before installing</p>
              <ul className="mt-1 grid gap-1 leading-6">
                {preview.blockers.map((blocker) => <li key={blocker.fieldId}>{blocker.message}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function InstallPlanPreview({ app, answers }: { app: MarketplaceApp; answers: SetupAnswers }) {
  const preview = setupPreviewForApp(app, answers) as SetupPreview;
  const sections = [
    { id: 'create', title: 'Create', icon: CheckCircle2 },
    { id: 'connect', title: 'Connect', icon: Info },
    { id: 'protect', title: 'Protect', icon: ShieldCheck },
    { id: 'check', title: 'Check', icon: CheckCircle2 },
    { id: 'afterInstall', title: 'After install', icon: Info },
  ] as const;

  return (
    <section className="grid gap-4 rounded-lg border border-slate-700/35 bg-slate-950/35 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-bold text-white">Install preview</h4>
          <p className="mt-1 text-sm leading-6 text-slate-400">Plain-language summary before Project OS changes this server.</p>
        </div>
        <Badge className={preview.ready ? 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100' : 'border-amber-300/25 bg-amber-500/10 text-amber-100'} variant="outline">
          {preview.ready ? 'Ready' : 'Needs setup'}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div className="rounded-lg border border-slate-700/30 bg-slate-900/45 p-3" key={section.id}>
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-violet-200" />
                <h5 className="text-sm font-bold text-white">{section.title}</h5>
              </div>
              <ul className="mt-2 grid gap-1 text-sm leading-6 text-slate-300">
                {preview.sections[section.id].map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          );
        })}
      </div>

      {preview.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-300/25 bg-amber-500/10 p-3 text-sm leading-6 text-amber-100">
          {preview.warnings.map((warning) => <p key={warning}>{warning}</p>)}
        </div>
      )}
    </section>
  );
}

export function SetupSummaryList({ app, answers }: { app: MarketplaceApp; answers: SetupAnswers }) {
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {(setupSummaryItems(app, answers) as Array<{ label: string; value: string }>).map((item) => (
        <div className="rounded-lg border border-slate-700/30 bg-slate-950/35 p-3" key={item.label}>
          <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">{item.label}</dt>
          <dd className="mt-1 text-sm font-medium text-slate-100">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SetupField({
  input,
  onChange,
  problem,
  value,
}: {
  input: SetupInput;
  onChange: (value: unknown) => void;
  problem?: { message: string };
  value: unknown;
}) {
  const selectedOption = input.options?.find((option) => option.value === value);
  const inputId = `marketplace-setup-${input.id}`;
  return (
    <div className="grid gap-2 text-sm">
      <span className="flex items-center justify-between gap-3">
        <label className="font-semibold text-slate-200" htmlFor={inputId}>{input.label}</label>
        {input.help && (
          <Popover>
            <PopoverTrigger asChild>
              <Button aria-label={`${input.label} help`} className={poButtonClass('quietIcon')} size="icon" type="button" variant="outline">
                <HelpCircle className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="border-slate-700 bg-slate-950 text-slate-200">
              <p className="text-sm leading-6">{input.help}</p>
            </PopoverContent>
          </Popover>
        )}
      </span>

      {input.type === 'choice' && (
        <>
          <Select value={String(value ?? '')} onValueChange={onChange}>
            <SelectTrigger className={cn('h-10 w-full border-slate-700/40 bg-slate-950/60 text-white', problem && 'border-amber-300/50')} id={inputId}>
              <SelectValue placeholder="Choose an option" />
            </SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-950 text-slate-100">
              {input.options?.map((option) => (
                <SelectItem className="focus:bg-slate-800 focus:text-white" key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedOption?.description && <span className="text-xs leading-5 text-slate-500">{selectedOption.description}</span>}
        </>
      )}

      {input.type !== 'choice' && (
        <Input
          className={cn('border-slate-700/40 bg-slate-950/60 text-white placeholder:text-slate-600', problem && 'border-amber-300/50')}
          id={inputId}
          inputMode={input.type === 'number-or-auto' ? 'numeric' : undefined}
          onChange={(event) => onChange(input.type === 'number-or-auto' ? normalizePortValue(event.target.value) : event.target.value)}
          placeholder={input.type === 'number-or-auto' ? 'Auto' : undefined}
          type="text"
          value={String(value ?? '')}
        />
      )}

      {problem && (
        <>
          <Separator className="bg-amber-300/20" />
          <span className="text-xs leading-5 text-amber-200">{problem.message}</span>
        </>
      )}
    </div>
  );
}

function shouldShowInput(input: SetupInput, answers: SetupAnswers) {
  if (!input.showWhen) {
    return true;
  }
  return Object.entries(input.showWhen).every(([fieldId, value]) => answers[fieldId] === value);
}

function normalizePortValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === 'auto') {
    return 'auto';
  }
  return Number(trimmed);
}
