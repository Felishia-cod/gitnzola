import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Amigos } from './amigos';

describe('Amigos', () => {
  let component: Amigos;
  let fixture: ComponentFixture<Amigos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Amigos],
    }).compileComponents();

    fixture = TestBed.createComponent(Amigos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
