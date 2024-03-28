import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeguimientoComponentList } from './seguimiento.component';

describe('SeguimientoComponentList', () => {
  let component: SeguimientoComponentList;
  let fixture: ComponentFixture<SeguimientoComponentList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SeguimientoComponentList ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SeguimientoComponentList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
