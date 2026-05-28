import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuardadosComponent } from './guardados';

describe('Guardados', () => {
  let component: GuardadosComponent;
  let fixture: ComponentFixture<GuardadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuardadosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GuardadosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
