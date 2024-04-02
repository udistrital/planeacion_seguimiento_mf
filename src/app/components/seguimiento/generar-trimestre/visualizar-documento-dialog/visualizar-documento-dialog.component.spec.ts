import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualizarDocumentoDialogComponent } from './visualizar-documento-dialog.component';

describe('VisualizarDocumentoDialogComponent', () => {
  let component: VisualizarDocumentoDialogComponent;
  let fixture: ComponentFixture<VisualizarDocumentoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VisualizarDocumentoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VisualizarDocumentoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
