import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PreviewCard } from "./preview-card";

describe("PreviewCard", () => {
  let component: PreviewCard;
  let fixture: ComponentFixture<PreviewCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewCard],
    }).compileComponents();

    fixture = TestBed.createComponent(PreviewCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
