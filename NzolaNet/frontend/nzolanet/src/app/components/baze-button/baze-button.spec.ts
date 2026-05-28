import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BazeButton } from './baze-button';

describe('BazeButton', () => {
  let component: BazeButton;
  let fixture: ComponentFixture<BazeButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BazeButton],
    }).compileComponents();

    fixture = TestBed.createComponent(BazeButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
