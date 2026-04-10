import type { ConstitutionalRule } from "@prisma/client";
import { RecordType, RuleScope, VisibilityStatus } from "@prisma/client";
import {
  RECORD_TYPE_ORDER,
  RULE_SCOPE_ORDER,
  RULE_SEVERITY_ORDER,
  RULE_TYPE_ORDER,
  VISIBILITY_ORDER,
} from "@/lib/constitutional-rule-constants";
import { fieldClass, labelClass, labelSpanClass } from "@/lib/admin-styles";

type ActionFn = (formData: FormData) => Promise<void>;

export function ConstitutionalRuleForm(props: {
  action: ActionFn;
  submitLabel: string;
  defaults?: Partial<ConstitutionalRule>;
}) {
  const d = props.defaults;
  const configStr =
    d?.config && typeof d.config === "object" ? JSON.stringify(d.config, null, 2) : "";

  return (
    <form action={props.action} className="space-y-4">
      {d?.id ? <input type="hidden" name="id" value={d.id} /> : null}
      {d?.id ? (
        <input type="hidden" name="key" value={d.key} />
      ) : null}
      <label className={labelClass}>
        <span className={labelSpanClass}>Key (slug)</span>
        {d?.id ? (
          <p className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-sm text-stone-800">
            {d.key}
          </p>
        ) : (
          <input name="key" required placeholder="truth-example-rule" defaultValue="" className={fieldClass} />
        )}
        <span className="text-xs text-stone-500">Lowercase, digits, hyphens. Immutable after create.</span>
      </label>
      <label className={labelClass}>
        <span className={labelSpanClass}>Name</span>
        <input name="name" required defaultValue={d?.name ?? ""} className={fieldClass} />
      </label>
      <label className={labelClass}>
        <span className={labelSpanClass}>Description</span>
        <textarea name="description" required rows={6} defaultValue={d?.description ?? ""} className={fieldClass} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          <span className={labelSpanClass}>Rule type</span>
          <select name="ruleType" required defaultValue={d?.ruleType ?? RULE_TYPE_ORDER[0]} className={fieldClass}>
            {RULE_TYPE_ORDER.map((rt) => (
              <option key={rt} value={rt}>
                {rt}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Scope</span>
          <select name="scope" required defaultValue={d?.scope ?? RuleScope.GLOBAL} className={fieldClass}>
            {RULE_SCOPE_ORDER.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Severity</span>
          <select name="severity" required defaultValue={d?.severity ?? RULE_SEVERITY_ORDER[0]} className={fieldClass}>
            {RULE_SEVERITY_ORDER.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Active</span>
          <select
            name="isActive"
            required
            defaultValue={d?.isActive === false ? "false" : "true"}
            className={fieldClass}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Record type</span>
          <select name="recordType" required defaultValue={d?.recordType ?? RecordType.HYBRID} className={fieldClass}>
            {RECORD_TYPE_ORDER.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelSpanClass}>Visibility</span>
          <select name="visibility" required defaultValue={d?.visibility ?? VisibilityStatus.REVIEW} className={fieldClass}>
            {VISIBILITY_ORDER.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={labelClass}>
        <span className={labelSpanClass}>Certainty (optional)</span>
        <input name="certainty" defaultValue={d?.certainty ?? ""} className={fieldClass} placeholder="system, author, …" />
      </label>
      <label className={labelClass}>
        <span className={labelSpanClass}>Narrative permission (future)</span>
        <input
          name="narrativePermission"
          defaultValue={d?.narrativePermission ?? ""}
          className={fieldClass}
          placeholder="Reserved for Stage 2+ ontology"
        />
      </label>
      <label className={labelClass}>
        <span className={labelSpanClass}>Config JSON (object)</span>
        <textarea
          name="configJson"
          rows={4}
          defaultValue={configStr}
          className={fieldClass}
          placeholder='{"example": true}'
        />
      </label>
      <label className={labelClass}>
        <span className={labelSpanClass}>Notes</span>
        <textarea name="notes" rows={2} defaultValue={d?.notes ?? ""} className={fieldClass} />
      </label>
      <button type="submit" className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-amber-50">
        {props.submitLabel}
      </button>
    </form>
  );
}
