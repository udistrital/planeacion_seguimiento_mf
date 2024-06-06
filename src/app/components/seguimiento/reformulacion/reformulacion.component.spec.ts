import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReformulacionComponent } from './reformulacion.component';

describe('ReformulacionComponent', () => {
  let component: ReformulacionComponent;
  let fixture: ComponentFixture<ReformulacionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReformulacionComponent]
    });
    fixture = TestBed.createComponent(ReformulacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
