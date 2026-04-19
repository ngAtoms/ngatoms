import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgAtomsDatePickerComponent } from '../../../components/date-picker';
import { NgAtomsBadgeDirective } from '../../../components/badge';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { TocComponent } from '../../../components/toc/toc.component';
import { PreviewCard } from '../../../components/preview-card/preview-card';

@Component({
  selector: 'app-date-picker-page',
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsDatePickerComponent,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: './date-picker-page.component.html',
  styleUrl: './date-picker-page.component.css',
})
export class DatePickerPageComponent {
  readonly single     = signal('');
  readonly rangeStart = signal('');
  readonly rangeEnd   = signal('');

  readonly today    = new Date();
  readonly minDate  = this.fmt(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  readonly maxDate  = this.fmt(new Date(this.today.getFullYear(), this.today.getMonth() + 2, 0));

  readonly availableDates = [
    this.fmt(new Date(this.today.getFullYear(), this.today.getMonth(), 3)),
    this.fmt(new Date(this.today.getFullYear(), this.today.getMonth(), 7)),
    this.fmt(new Date(this.today.getFullYear(), this.today.getMonth(), 12)),
    this.fmt(new Date(this.today.getFullYear(), this.today.getMonth(), 18)),
    this.fmt(new Date(this.today.getFullYear(), this.today.getMonth(), 24)),
  ];

  private fmt(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  readonly heroCode = `<nga-date-picker [(value)]="date" placeholder="Pick a date" />`;

  readonly usageCode = `import { NgAtomsDatePickerComponent } from './ui/date-picker';
import { signal } from '@angular/core';

@Component({
  standalone: true,
  imports: [NgAtomsDatePickerComponent],
  template: \`
    <nga-date-picker [(value)]="date" placeholder="Pick a date" />
  \`,
})
export class MyComponent {
  readonly date = signal('');
}`;

  readonly singleCode = `<nga-date-picker [(value)]="date" placeholder="Pick a date" />`;

  readonly rangeCode = `<nga-date-picker
  mode="range"
  [(startDate)]="start"
  [(endDate)]="end"
  placeholder="Select a range"
/>`;

  readonly constraintsCode = `<nga-date-picker
  [minDate]="minDate"
  [maxDate]="maxDate"
  placeholder="Pick a date"
/>

<!-- Only specific dates are selectable -->
<nga-date-picker
  [availableDates]="bookableDates"
  placeholder="Pick a date"
/>`;

  readonly sizesCode = `<nga-date-picker size="sm" placeholder="Small" />
<nga-date-picker size="md" placeholder="Medium" />
<nga-date-picker size="lg" placeholder="Large" />`;

  readonly i18nCode = `<nga-date-picker
  locale="pt-BR"
  [dayLabels]="['Do', 'Se', 'Te', 'Qu', 'Qu', 'Se', 'Sá']"
  [monthLabels]="['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']"
  placeholder="Selecione uma data"
/>`;

  readonly props = [
    { name: 'value',          type: 'string',                         defaultVal: `''`,        description: 'Two-way bound ISO date string (YYYY-MM-DD) for single mode.' },
    { name: 'startDate',      type: 'string',                         defaultVal: `''`,        description: 'Two-way bound start date for range mode.' },
    { name: 'endDate',        type: 'string',                         defaultVal: `''`,        description: 'Two-way bound end date for range mode.' },
    { name: 'mode',           type: `'single' | 'range'`,             defaultVal: `'single'`,  description: 'Single date or date range selection.' },
    { name: 'placeholder',    type: 'string',                         defaultVal: `''`,        description: 'Text shown when no date is selected.' },
    { name: 'size',           type: `'sm' | 'md' | 'lg'`,             defaultVal: `'md'`,      description: 'Sizing preset for the trigger input.' },
    { name: 'minDate',        type: 'string',                         defaultVal: '—',         description: 'Earliest selectable date (YYYY-MM-DD).' },
    { name: 'maxDate',        type: 'string',                         defaultVal: '—',         description: 'Latest selectable date (YYYY-MM-DD).' },
    { name: 'availableDates', type: 'string[]',                       defaultVal: '[]',        description: 'If non-empty, only these dates are selectable.' },
    { name: 'showToday',      type: 'boolean',                        defaultVal: 'false',     description: 'Shows a "Today" button in the calendar footer.' },
    { name: 'locale',         type: 'string',                         defaultVal: `'en-US'`,   description: 'BCP 47 locale tag used for month/day formatting.' },
    { name: 'dayLabels',      type: 'string[]',                       defaultVal: '—',         description: 'Custom day-of-week header labels (7 entries).' },
    { name: 'monthLabels',    type: 'string[]',                       defaultVal: '—',         description: 'Custom month name labels (12 entries).' },
    { name: 'invalid',        type: 'boolean',                        defaultVal: 'false',     description: 'Applies error state styling to the trigger.' },
    { name: 'disabled',       type: 'boolean',                        defaultVal: 'false',     description: 'Prevents interaction with the date picker.' },
  ];

  readonly tocItems = [
    { id: 'usage',       label: 'Usage' },
    { id: 'single',      label: 'Single date' },
    { id: 'range',       label: 'Range selection' },
    { id: 'constraints', label: 'Constraints' },
    { id: 'sizes',       label: 'Sizes' },
    { id: 'i18n',        label: 'Internationalization' },
    { id: 'api',         label: 'API' },
  ];
}
