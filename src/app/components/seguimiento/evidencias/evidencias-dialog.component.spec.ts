import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EvidenciasDialogComponent } from './evidencias-dialog.component';


describe('Evidencias', () => {
  let component: EvidenciasDialogComponent;
  let fixture: ComponentFixture<EvidenciasDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvidenciasDialogComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EvidenciasDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
