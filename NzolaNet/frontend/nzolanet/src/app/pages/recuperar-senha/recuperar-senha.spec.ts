import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecuperarSenhaComponent } from './recuperar-senha';

describe('RecuperarSenha', () => {
  let component: RecuperarSenhaComponent;
  let fixture: ComponentFixture<RecuperarSenhaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecuperarSenhaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RecuperarSenhaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
