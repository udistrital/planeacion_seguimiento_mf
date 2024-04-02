import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerarTrimestreComponent } from './generar-trimestre.component';

describe('GenerarTrimestreComponent', () => {
  let component: GenerarTrimestreComponent;
  let fixture: ComponentFixture<GenerarTrimestreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GenerarTrimestreComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GenerarTrimestreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
