'use client';

export const CREATOR_FILTER_ALL = 'all';

export interface CreatorFilterValues {
  platform: string;
  focusArea: string;
  skillLevel: string;
}

export const emptyCreatorFilters: CreatorFilterValues = {
  platform: CREATOR_FILTER_ALL,
  focusArea: CREATOR_FILTER_ALL,
  skillLevel: CREATOR_FILTER_ALL,
};

interface CreatorFiltersProps {
  platforms: string[];
  focusAreas: string[];
  skillLevels: string[];
  value: CreatorFilterValues;
  onChange: (next: CreatorFilterValues) => void;
}

export function CreatorFilters({
  platforms,
  focusAreas,
  skillLevels,
  value,
  onChange,
}: CreatorFiltersProps) {
  const hasActiveFilters =
    value.platform !== CREATOR_FILTER_ALL ||
    value.focusArea !== CREATOR_FILTER_ALL ||
    value.skillLevel !== CREATOR_FILTER_ALL;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <FilterSelect
        label="Platform"
        value={value.platform}
        options={platforms}
        onChange={(platform) => onChange({ ...value, platform })}
      />
      <FilterSelect
        label="Focus area"
        value={value.focusArea}
        options={focusAreas}
        onChange={(focusArea) => onChange({ ...value, focusArea })}
      />
      <FilterSelect
        label="Skill level"
        value={value.skillLevel}
        options={skillLevels}
        onChange={(skillLevel) => onChange({ ...value, skillLevel })}
      />

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onChange(emptyCreatorFilters)}
          className="text-sm font-medium text-accent hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const id = `creator-filter-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm font-medium text-fg-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-none border border-border bg-surface px-2 text-sm text-fg"
      >
        <option value={CREATOR_FILTER_ALL}>All {label.toLowerCase()}s</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
