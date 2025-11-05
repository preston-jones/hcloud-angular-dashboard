import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-location-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="location-map-container relative w-full h-full">
      @if (countryCode()) {
        <div class="map-svg-wrapper w-full h-full flex items-center justify-center rounded-lg p-2">
          <img 
            [src]="getMapPath()" 
            [alt]="locationName() + ' map'"
            class="max-w-full max-h-full object-contain country-map"
            [style.filter]="getHueRotation()"
          />
        </div>
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="text-center">
            <div class="w-3 h-3 bg-primary rounded-full shadow-lg border-2 border-white mb-1 mx-auto animate-pulse"></div>
            <div class="text-xs font-medium text-ink bg-white dark:bg-slate-800 dark:text-white px-2 py-1 rounded shadow-sm border border-ui">
              {{ locationName() }}
            </div>
          </div>
        </div>
      } @else {
        <div class="w-full h-full flex items-center justify-center rounded-lg">
          <div class="text-center text-soft">
            <div class="text-2xl mb-2">🌍</div>
            <div class="text-sm">{{ locationName() || 'Unknown Location' }}</div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .location-map-container {
      min-height: 120px;
    }
    
    .map-svg-wrapper {
      transition: all 0.3s ease;
      background: transparent;
    }
    
    .map-svg-wrapper:hover {
      transform: scale(1.02);
    }

    .country-map {
      opacity: 0.8;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationMapComponent {
  countryCode = input<string>('');
  locationName = input<string>('');

  private readonly countryMaps: Record<string, string> = {
    'DE': 'de.svg',
    'FI': 'fi.svg', 
    'US': 'us.svg',
    'SG': 'sg.svg'
  };

  private readonly countryColors: Record<string, number> = {
    'DE': 120,  // Green
    'FI': 200,  // Helsinki Blue
    'US': 240,  // Blue
    'SG': 60    // Yellow-Green
  };

  getHueRotation(): string {
    const hue = this.countryColors[this.countryCode().toUpperCase()] || 200;
    return `hue-rotate(${hue}deg)`;
  }

  getMapPath(): string {
    const mapFile = this.countryMaps[this.countryCode().toUpperCase()];
    return mapFile ? `/assets/maps/${mapFile}` : '';
  }
}