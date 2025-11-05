import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-info-dialog',
  templateUrl: './info-dialog.html',
  styleUrls: ['./info-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoDialogComponent {
  close = output<void>();
  
  // Get current year for copyright
  get currentYear(): number {
    return new Date().getFullYear();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onCloseClick() {
    this.close.emit();
  }
}