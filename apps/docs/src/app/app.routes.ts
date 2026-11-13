import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'get-started', pathMatch: 'full' },
  {
    path: 'get-started',
    loadComponent: () =>
      import('./pages/get-started/get-started-page.component').then(m => m.GetStartedPageComponent),
  },
  {
    path: 'alert',
    loadComponent: () =>
      import('./pages/alert/alert-page.component').then(m => m.AlertPageComponent),
  },
  {
    path: 'checkbox',
    loadComponent: () =>
      import('./pages/checkbox/checkbox-page.component').then(m => m.CheckboxPageComponent),
  },
  {
    path: 'textarea',
    loadComponent: () =>
      import('./pages/textarea/textarea-page.component').then(m => m.TextareaPageComponent),
  },
  {
    path: 'separator',
    loadComponent: () =>
      import('./pages/separator/separator-page.component').then(m => m.SeparatorPageComponent),
  },
  {
    path: 'card',
    loadComponent: () =>
      import('./pages/card/card-page.component').then(m => m.CardPageComponent),
  },
  {
    path: 'badge',
    loadComponent: () =>
      import('./pages/badge/badge-page.component').then(m => m.BadgePageComponent),
  },
  {
    path: 'button',
    loadComponent: () =>
      import('./pages/button/button-page.component').then(m => m.ButtonPageComponent),
  },
  {
    path: 'input',
    loadComponent: () =>
      import('./pages/input/input-page.component').then(m => m.InputPageComponent),
  },
  {
    path: 'tooltip',
    loadComponent: () =>
      import('./pages/tooltip/tooltip-page.component').then(m => m.TooltipPageComponent),
  },
  {
    path: 'dialog',
    loadComponent: () =>
      import('./pages/dialog/dialog-page.component').then(m => m.DialogPageComponent),
  },
  {
    path: 'accordion',
    loadComponent: () =>
      import('./pages/accordion/accordion-page.component').then(m => m.AccordionPageComponent),
  },
  {
    path: 'tabs',
    loadComponent: () =>
      import('./pages/tabs/tabs-page.component').then(m => m.TabsPageComponent),
  },
  {
    path: 'select',
    loadComponent: () =>
      import('./pages/select/select-page.component').then(m => m.SelectPageComponent),
  },
  {
    path: 'switch',
    loadComponent: () =>
      import('./pages/switch/switch-page.component').then(m => m.SwitchPageComponent),
  },
  {
    path: 'spinner',
    loadComponent: () =>
      import('./pages/spinner/spinner-page.component').then(m => m.SpinnerPageComponent),
  },
  {
    path: 'radio-group',
    loadComponent: () =>
      import('./pages/radio-group/radio-group-page.component').then(m => m.RadioGroupPageComponent),
  },
  {
    path: 'avatar',
    loadComponent: () =>
      import('./pages/avatar/avatar-page.component').then(m => m.AvatarPageComponent),
  },
  {
    path: 'progress',
    loadComponent: () =>
      import('./pages/progress/progress-page.component').then(m => m.ProgressPageComponent),
  },
  {
    path: 'number-input',
    loadComponent: () =>
      import('./pages/number-input/number-input-page.component').then(m => m.NumberInputPageComponent),
  },
  {
    path: 'popover',
    loadComponent: () =>
      import('./pages/popover/popover-page.component').then(m => m.PopoverPageComponent),
  },
  {
    path: 'date-picker',
    loadComponent: () =>
      import('./pages/date-picker/date-picker-page.component').then(m => m.DatePickerPageComponent),
  },
  {
    path: 'dropdown-menu',
    loadComponent: () =>
      import('./pages/dropdown-menu/dropdown-menu-page.component').then(m => m.DropdownMenuPageComponent),
  },
  {
    path: 'skeleton',
    loadComponent: () =>
      import('./pages/skeleton/skeleton-page.component').then(m => m.SkeletonPageComponent),
  },
  {
    path: 'breadcrumb',
    loadComponent: () =>
      import('./pages/breadcrumb/breadcrumb-page.component').then(m => m.BreadcrumbPageComponent),
  },
  {
    path: 'timeline',
    loadComponent: () =>
      import('./pages/timeline/timeline-page.component').then(m => m.TimelinePageComponent),
  },
  {
    path: 'rating',
    loadComponent: () =>
      import('./pages/rating/rating-page.component').then(m => m.RatingPageComponent),
  },
  {
    path: 'pagination',
    loadComponent: () =>
      import('./pages/pagination/pagination-page.component').then(m => m.PaginationPageComponent),
  },
  {
    path: 'stepper',
    loadComponent: () =>
      import('./pages/stepper/stepper-page.component').then(m => m.StepperPageComponent),
  },
  {
    path: 'slider',
    loadComponent: () =>
      import('./pages/slider/slider-page.component').then(m => m.SliderPageComponent),
  },
  {
    path: 'tag-input',
    loadComponent: () =>
      import('./pages/tag-input/tag-input-page.component').then(m => m.TagInputPageComponent),
  },
  {
    path: 'file-upload',
    loadComponent: () =>
      import('./pages/file-upload/file-upload-page.component').then(m => m.FileUploadPageComponent),
  },
  {
    path: 'drawer',
    loadComponent: () =>
      import('./pages/drawer/drawer-page.component').then(m => m.DrawerPageComponent),
  },
  {
    path: 'context-menu',
    loadComponent: () =>
      import('./pages/context-menu/context-menu-page.component').then(m => m.ContextMenuPageComponent),
  },
  {
    path: 'combobox',
    loadComponent: () =>
      import('./pages/combobox/combobox-page.component').then(m => m.ComboboxPageComponent),
  },
  {
    path: 'color-picker',
    loadComponent: () =>
      import('./pages/color-picker/color-picker-page.component').then(m => m.ColorPickerPageComponent),
  },
  {
    path: 'tree',
    loadComponent: () =>
      import('./pages/tree/tree-page.component').then(m => m.TreePageComponent),
  },
  {
    path: 'code-block',
    loadComponent: () =>
      import('./pages/code-block/code-block-page.component').then(m => m.CodeBlockPageComponent),
  },
  {
    path: 'grid',
    loadComponent: () =>
      import('./pages/grid/grid-page.component').then(m => m.GridPageComponent),
  },
];
