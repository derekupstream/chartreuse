/**
 * FacetedFilterBar — pill-chip filter bar with multi-select dropdowns.
 *
 * Each filter appears as a rounded chip. Clicking opens a floating panel with
 * checkboxes. A count badge shows how many values are selected. A DateRangeChip
 * handles the date dimension via an antd Popover.
 *
 * Works in two modes (decided by the parent):
 *   - Client-side: parent filters data.projects in-place (instant)
 *   - URL-based: parent calls router.replace (page reload)
 * The bar itself is mode-agnostic — it just calls onChange / onDateChange.
 */
import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { CheckOutlined } from '@ant-design/icons';
import { DatePicker, Popover } from 'antd';
import dayjs from 'dayjs';

// ─── Public types ────────────────────────────────────────────────────────────

export interface FilterOption {
  value: string;
  label: string;
}

export interface FacetedFilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface FacetedFilterBarProps {
  /** List of multi-select filters (tags, accounts, states, projects…) */
  filters: FacetedFilterConfig[];
  /** Currently-selected values per filter key */
  selected: Record<string, string[]>;
  /** Currently-selected date range [YYYY-MM-DD | null, YYYY-MM-DD | null] */
  dateRange: [string | null, string | null];
  /** Called when a multi-select filter changes */
  onChange: (key: string, values: string[]) => void;
  /** Called when the date range changes */
  onDateChange: (range: [string | null, string | null]) => void;
  /** Called when "Clear all" is clicked */
  onClearAll: () => void;
}

// ─── Animation ───────────────────────────────────────────────────────────────

const dropIn = keyframes`
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0);    }
`;

// ─── Styled components ───────────────────────────────────────────────────────

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding: 12px 0 8px;
  /* hide scrollbar but keep swipe-ability */
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const ChipWrap = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const Chip = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1.5px solid ${p => (p.$active ? '#95ee49' : '#e2e2e2')};
  background: ${p => (p.$active ? '#f2ffe6' : '#fff')};
  color: #1a1a1a;
  font-size: 13px;
  font-weight: ${p => (p.$active ? 600 : 400)};
  cursor: pointer;
  white-space: nowrap;
  line-height: 1;
  user-select: none;
  transition:
    border-color 0.15s,
    background 0.15s;

  &:hover {
    border-color: ${p => (p.$active ? '#78d438' : '#bbb')};
    background: ${p => (p.$active ? '#eaffe0' : '#fafafa')};
  }
  &:focus-visible {
    outline: 2px solid #95ee49;
    outline-offset: 2px;
  }
`;

const CountBadge = styled.span`
  background: #95ee49;
  color: #1a1a1a;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  padding: 1px 6px;
  line-height: 1.4;
`;

const Chevron = styled.span<{ $open: boolean }>`
  font-size: 10px;
  display: inline-block;
  color: #888;
  line-height: 1;
  transition: transform 0.15s;
  transform: rotate(${p => (p.$open ? '180deg' : '0deg')});
`;

const Panel = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 1000;
  min-width: 220px;
  background: #fff;
  border-radius: 10px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.12),
    0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  animation: ${dropIn} 0.13s ease;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px 8px;
  border-bottom: 1px solid #f0f0f0;
`;

const PanelTitle = styled.span`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #aaa;
`;

const ClearBtn = styled.button`
  background: none;
  border: none;
  font-size: 12px;
  color: #999;
  cursor: pointer;
  padding: 0;
  &:hover {
    color: #333;
  }
`;

const OptionList = styled.div`
  max-height: 280px;
  overflow-y: auto;
  padding: 4px 0;
`;

const OptionRow = styled.div<{ $checked: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  color: #1a1a1a;
  background: ${p => (p.$checked ? '#f2ffe6' : 'transparent')};
  transition: background 0.1s;
  &:hover {
    background: ${p => (p.$checked ? '#eaffe0' : '#f7f7f7')};
  }
`;

const CustomCheck = styled.div<{ $checked: boolean }>`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid ${p => (p.$checked ? '#95ee49' : '#ccc')};
  background: ${p => (p.$checked ? '#95ee49' : '#fff')};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 9px;
  color: #1a1a1a;
  transition: all 0.1s;
`;

const ClearAllButton = styled.button`
  background: none;
  border: none;
  font-size: 12px;
  color: #999;
  cursor: pointer;
  white-space: nowrap;
  padding: 6px 4px;
  flex-shrink: 0;
  text-decoration: underline;
  &:hover {
    color: #333;
  }
`;

// ─── FilterChip ──────────────────────────────────────────────────────────────

interface FilterChipProps {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}

function FilterChip({ label, options, selected, onChange }: FilterChipProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const count = selected.length;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  }

  return (
    <ChipWrap ref={wrapRef}>
      <Chip
        $active={count > 0}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup='listbox'
        type='button'
      >
        {label}
        {count > 0 && <CountBadge>{count}</CountBadge>}
        <Chevron $open={open}>▾</Chevron>
      </Chip>

      {open && (
        <Panel role='listbox' aria-multiselectable='true' aria-label={label}>
          <PanelHeader>
            <PanelTitle>{label}</PanelTitle>
            {count > 0 && (
              <ClearBtn onClick={() => onChange([])} type='button'>
                Clear
              </ClearBtn>
            )}
          </PanelHeader>
          <OptionList>
            {options.map(opt => {
              const checked = selected.includes(opt.value);
              return (
                <OptionRow
                  key={opt.value}
                  $checked={checked}
                  tabIndex={0}
                  role='option'
                  aria-selected={checked}
                  onClick={() => toggle(opt.value)}
                  onKeyDown={e => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      toggle(opt.value);
                    }
                  }}
                >
                  <CustomCheck $checked={checked}>{checked && <CheckOutlined />}</CustomCheck>
                  {opt.label}
                </OptionRow>
              );
            })}
          </OptionList>
        </Panel>
      )}
    </ChipWrap>
  );
}

// ─── DateRangeChip ───────────────────────────────────────────────────────────

interface DateRangeChipProps {
  value: [string | null, string | null];
  onChange: (range: [string | null, string | null]) => void;
}

function DateRangeChip({ value, onChange }: DateRangeChipProps) {
  const [open, setOpen] = useState(false);
  const isActive = value[0] != null || value[1] != null;

  const label = isActive
    ? [value[0] ? dayjs(value[0]).format('MMM D') : '…', value[1] ? dayjs(value[1]).format('MMM D, YYYY') : '…'].join(
        ' → '
      )
    : 'Date range';

  return (
    <ChipWrap>
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger='click'
        content={
          <div style={{ padding: '4px 0' }}>
            <DatePicker.RangePicker
              value={[value[0] ? dayjs(value[0]) : null, value[1] ? dayjs(value[1]) : null] as any}
              allowEmpty={[true, true]}
              onChange={range => {
                const newRange: [string | null, string | null] = [
                  range?.[0]?.format('YYYY-MM-DD') ?? null,
                  range?.[1]?.format('YYYY-MM-DD') ?? null
                ];
                onChange(newRange);
                // auto-close once both dates are chosen
                if (newRange[0] && newRange[1]) setOpen(false);
              }}
            />
            {isActive && (
              <div style={{ marginTop: 8, textAlign: 'right' }}>
                <ClearBtn
                  onClick={() => {
                    onChange([null, null]);
                    setOpen(false);
                  }}
                  type='button'
                >
                  Clear dates
                </ClearBtn>
              </div>
            )}
          </div>
        }
      >
        <Chip $active={isActive} type='button'>
          {label}
          <Chevron $open={open}>▾</Chevron>
        </Chip>
      </Popover>
    </ChipWrap>
  );
}

// ─── FacetedFilterBar ────────────────────────────────────────────────────────

export function FacetedFilterBar({
  filters,
  selected,
  dateRange,
  onChange,
  onDateChange,
  onClearAll
}: FacetedFilterBarProps) {
  const hasActive = Object.values(selected).some(v => v.length > 0) || dateRange[0] != null || dateRange[1] != null;

  return (
    <FilterBar>
      {filters.map(f => (
        <FilterChip
          key={f.key}
          label={f.label}
          options={f.options}
          selected={selected[f.key] ?? []}
          onChange={vals => onChange(f.key, vals)}
        />
      ))}
      <DateRangeChip value={dateRange} onChange={onDateChange} />
      {hasActive && (
        <ClearAllButton onClick={onClearAll} type='button'>
          Clear all
        </ClearAllButton>
      )}
    </FilterBar>
  );
}
