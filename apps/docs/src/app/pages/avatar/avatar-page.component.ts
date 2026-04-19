import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgAtomsAvatarComponent } from '../../../components/avatar';
import { NgAtomsBadgeDirective } from '../../../components/badge';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';
import { TocComponent } from '../../../components/toc/toc.component';
import { PreviewCard } from '../../../components/preview-card/preview-card';

const SIZES = ['sm', 'md', 'lg', 'xl'] as const;

@Component({
  selector: 'app-avatar-page',
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsAvatarComponent,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: './avatar-page.component.html',
  styleUrl: './avatar-page.component.css',
})
export class AvatarPageComponent {
  readonly sizes = SIZES;

  readonly heroCode = `<nga-avatar src="https://i.pravatar.cc/150" alt="Jane Doe" size="sm" />
<nga-avatar src="https://i.pravatar.cc/150" alt="Jane Doe" size="md" />
<nga-avatar src="https://i.pravatar.cc/150" alt="Jane Doe" size="lg" />
<nga-avatar src="https://i.pravatar.cc/150" alt="Jane Doe" size="xl" />`;

  readonly usageCode = `import { NgAtomsAvatarComponent } from './ui/avatar';

@Component({
  standalone: true,
  imports: [NgAtomsAvatarComponent],
  template: \`
    <nga-avatar src="/assets/photo.jpg" alt="Jane Doe" size="md" />
  \`,
})
export class MyComponent {}`;

  readonly imageCode = `<nga-avatar src="https://i.pravatar.cc/150" alt="Jane Doe" size="sm" />
<nga-avatar src="https://i.pravatar.cc/150" alt="Jane Doe" size="md" />
<nga-avatar src="https://i.pravatar.cc/150" alt="Jane Doe" size="lg" />
<nga-avatar src="https://i.pravatar.cc/150" alt="Jane Doe" size="xl" />`;

  readonly initialsCode = `<!-- Initials fallback (no src needed) -->
<nga-avatar fallback="JD" size="sm" />
<nga-avatar fallback="JD" size="md" />
<nga-avatar fallback="JD" size="lg" />
<nga-avatar fallback="JD" size="xl" />`;

  readonly iconCode = `<!-- Generic icon fallback (no src or fallback) -->
<nga-avatar size="sm" />
<nga-avatar size="md" />
<nga-avatar size="lg" />
<nga-avatar size="xl" />`;

  readonly brokenCode = `<!-- Broken image → falls back to initials -->
<nga-avatar src="broken-url.jpg" fallback="AB" size="md" />

<!-- Broken image → falls back to icon -->
<nga-avatar src="broken-url.jpg" size="md" />`;

  readonly props = [
    { name: 'src',      type: 'string',                      defaultVal: `''`,    description: 'URL of the user image.' },
    { name: 'alt',      type: 'string',                      defaultVal: `''`,    description: 'Alt text for the image. Leave empty when purely decorative.' },
    { name: 'fallback', type: 'string',                      defaultVal: `''`,    description: 'Short text (1–2 chars) shown when no image is available.' },
    { name: 'size',     type: `'sm' | 'md' | 'lg' | 'xl'`,  defaultVal: `'md'`, description: 'Size preset for the avatar circle.' },
  ];

  readonly a11yItems = [
    { icon: 'image',        title: 'Alt text',         body: 'When the avatar conveys identity, provide a descriptive alt (e.g. "Jane Doe"). For purely decorative avatars, pass alt="" so screen readers skip it.' },
    { icon: 'warning',      title: 'Initials fallback', body: 'The fallback text is rendered as a visible label — it is not read as a meaningful name. Wrap the avatar in a tooltip or aria-label if identity matters.' },
    { icon: 'eye-slash',    title: 'Broken images',    body: 'The component handles load errors silently. The fallback (initials or icon) has role="img" so assistive technology can still surface it.' },
  ];

  readonly tocItems = [
    { id: 'usage',    label: 'Usage' },
    { id: 'image',    label: 'Image' },
    { id: 'initials', label: 'Initials fallback' },
    { id: 'icon',     label: 'Icon fallback' },
    { id: 'broken',   label: 'Broken image' },
    { id: 'api',      label: 'API' },
    { id: 'a11y',     label: 'Accessibility' },
  ];
}
