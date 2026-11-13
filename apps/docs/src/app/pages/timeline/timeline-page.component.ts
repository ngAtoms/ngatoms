import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  NgAtomsTimelineDirective,
  NgAtomsTimelineItemDirective,
  NgAtomsTimelineMarkerDirective,
  NgAtomsTimelineContentDirective,
  NgAtomsTimelineTitleDirective,
  NgAtomsTimelineTimeDirective,
  NgAtomsTimelineDescriptionDirective,
} from "../../../components/timeline";
import { NgAtomsBadgeDirective } from "../../../components/badge";
import { CodeBlockComponent } from "../../../components/code-block/code-block.component";
import { TocComponent } from "../../../components/toc/toc.component";
import { PreviewCard } from "../../../components/preview-card/preview-card";

@Component({
  selector: "app-timeline-page",
  standalone: true,
  imports: [
    RouterLink,
    NgAtomsTimelineDirective,
    NgAtomsTimelineItemDirective,
    NgAtomsTimelineMarkerDirective,
    NgAtomsTimelineContentDirective,
    NgAtomsTimelineTitleDirective,
    NgAtomsTimelineTimeDirective,
    NgAtomsTimelineDescriptionDirective,
    NgAtomsBadgeDirective,
    CodeBlockComponent,
    TocComponent,
    PreviewCard,
  ],
  templateUrl: "./timeline-page.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./timeline-page.component.css",
})
export class TimelinePageComponent {
  readonly heroCode = "<ol ngAtomsTimeline>\n  <li ngAtomsTimelineItem status=\"complete\">\n    <span ngAtomsTimelineMarker></span>\n    <div ngAtomsTimelineContent>\n      <p ngAtomsTimelineTitle>Order placed</p>\n      <time ngAtomsTimelineTime>Mar 3, 09:12</time>\n    </div>\n  </li>\n  <li ngAtomsTimelineItem status=\"active\">\n    <span ngAtomsTimelineMarker></span>\n    <div ngAtomsTimelineContent>\n      <p ngAtomsTimelineTitle>Shipped</p>\n      <time ngAtomsTimelineTime>Mar 4, 16:40</time>\n      <p ngAtomsTimelineDescription>Your package left the warehouse and is on its way.</p>\n    </div>\n  </li>\n  <li ngAtomsTimelineItem>\n    <span ngAtomsTimelineMarker></span>\n    <div ngAtomsTimelineContent>\n      <p ngAtomsTimelineTitle>Delivered</p>\n      <time ngAtomsTimelineTime>Expected Mar 6</time>\n    </div>\n  </li>\n</ol>";

  readonly usageCode = "import { Component } from '@angular/core';\nimport {\n  NgAtomsTimelineDirective,\n  NgAtomsTimelineItemDirective,\n  NgAtomsTimelineMarkerDirective,\n  NgAtomsTimelineContentDirective,\n  NgAtomsTimelineTitleDirective,\n  NgAtomsTimelineTimeDirective,\n  NgAtomsTimelineDescriptionDirective,\n} from './ui/timeline';\n\n@Component({\n  standalone: true,\n  imports: [\n    NgAtomsTimelineDirective,\n    NgAtomsTimelineItemDirective,\n    NgAtomsTimelineMarkerDirective,\n    NgAtomsTimelineContentDirective,\n    NgAtomsTimelineTitleDirective,\n    NgAtomsTimelineTimeDirective,\n    NgAtomsTimelineDescriptionDirective,\n  ],\n  templateUrl: './my.component.html',\n})\nexport class MyComponent {}";

  readonly codeStatus = "<li ngAtomsTimelineItem status=\"complete\">…</li>\n<li ngAtomsTimelineItem status=\"active\">…</li>\n<li ngAtomsTimelineItem>…</li>";

  readonly codeMarkers = "<span ngAtomsTimelineMarker>\n  <i class=\"ph-bold ph-rocket-launch\"></i>\n</span>";

  readonly propGroups = [
    {
      kind: "Inputs",
      target: "[ngAtomsTimelineItem]",
      props: [
        { name: "status", type: "'default' | 'active' | 'complete'", defaultVal: "'default'", description: "Visual state of the marker and of the connector below it." },
      ],
    },
    {
      kind: "Directives",
      target: "timeline",
      props: [
        { name: "ngAtomsTimeline", type: "ol", defaultVal: "—", description: "The list holding the events." },
        { name: "ngAtomsTimelineItem", type: "li", defaultVal: "—", description: "One event." },
        { name: "ngAtomsTimelineMarker", type: "span", defaultVal: "—", description: "Dot or icon on the line. Decorative." },
        { name: "ngAtomsTimelineContent", type: "div", defaultVal: "—", description: "Wraps the title, time, and description." },
        { name: "ngAtomsTimelineTitle", type: "p", defaultVal: "—", description: "Event title." },
        { name: "ngAtomsTimelineTime", type: "time", defaultVal: "—", description: "Timestamp." },
        { name: "ngAtomsTimelineDescription", type: "p", defaultVal: "—", description: "Supporting text." },
      ],
    },
  ];

  readonly a11yItems = [
    { icon: "list-numbers", title: "Ordered list", body: "Use <ol> and <li> so screen readers announce the number of events and the position of each." },
    { icon: "eye-slash", title: "Markers", body: "Markers and connectors are decorative and hidden from assistive technology. Put the meaning of a status in the text when it matters." },
    { icon: "clock", title: "Timestamps", body: "Use a <time> element with a datetime attribute for machine-readable dates." },
  ];

  readonly tocItems = [
    { id: "usage", label: "Usage" },
    { id: "status", label: "Status" },
    { id: "markers", label: "Custom markers" },
    { id: "api", label: "API" },
    { id: "a11y", label: "Accessibility" },
  ];
}
