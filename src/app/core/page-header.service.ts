import { Injectable, signal, TemplateRef } from '@angular/core';

export interface PageHeaderData {
  title?: string;
  subtitle?: string;
  template?: TemplateRef<any>;
  context?: any;
}

@Injectable({ providedIn: 'root' })
export class PageHeaderService {
  private headerData = signal<PageHeaderData | null>(null);
  
  // Expose as readonly computed
  header = this.headerData.asReadonly();

  setHeader(data: PageHeaderData | null): void {
    this.headerData.set(data);
  }

  clearHeader(): void {
    this.headerData.set(null);
  }
}