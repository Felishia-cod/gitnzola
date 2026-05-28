import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmarRegistoComponent } from './confirmar-registo';

describe('ConfirmarRegistoComponent', () => {
  let component: ConfirmarRegistoComponent;
  let fixture: ComponentFixture<ConfirmarRegistoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmarRegistoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmarRegistoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
