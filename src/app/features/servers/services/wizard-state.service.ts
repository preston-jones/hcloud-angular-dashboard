import { Injectable, signal, computed } from '@angular/core';
import { 
  ServerArchitecture, 
  CpuArchitecture, 
  ImageTab, 
  ServerLabel, 
  WizardStep 
} from '../../../core/models';

/**
 * Service to manage wizard state, navigation, and step completion logic
 */
@Injectable({
  providedIn: 'root'
})
export class WizardStateService {

  // ============================================================================
  // WIZARD SELECTION STATE
  // ============================================================================
  selectedArchitecture = signal<ServerArchitecture | ''>('');
  selectedCpuArchitecture = signal<CpuArchitecture>('x86');
  selectedLocation = signal<string>('');
  selectedImage = signal<string>('');
  selectedServerType = signal<string>('');
  activeImageTab = signal<ImageTab>('os');

  // ============================================================================
  // CONFIGURATION STATE
  // ============================================================================
  enableBackups = signal(false);
  enablePublicIPv4 = signal(true);
  enablePublicIPv6 = signal(true);
  selectedBackupWindow = signal<string>('22-02');
  selectedFirewalls = signal<number[]>([]);
  serverLabels = signal<ServerLabel[]>([]);
  labelsTextarea = signal<string>('');
  serverName = signal<string>('');
  nameError = signal<string>('');
  nameStepTouched = signal<boolean>(false);

  // ============================================================================
  // UI STATE
  // ============================================================================
  activeSection = signal<WizardStep>('step-architecture');

  // ============================================================================
  // COMPUTED STEP COMPLETION STATUS
  // ============================================================================
  isArchitectureComplete = computed(() => 
    Boolean(this.selectedArchitecture() && this.selectedServerType())
  );
  
  isLocationComplete = computed(() => Boolean(this.selectedLocation()));
  
  isImageComplete = computed(() => Boolean(this.selectedImage()));
  
  isNetworkingComplete = computed(() => 
    this.enablePublicIPv4() || this.enablePublicIPv6()
  );
  
  isSecurityComplete = computed(() => this.selectedFirewalls().length > 0);
  
  isBackupsComplete = computed(() => this.enableBackups());
  
  isLabelsComplete = computed(() => this.serverLabels().length > 0);
  
  isNameComplete = computed(() => {
    // Step is complete only after user interaction (touched the field)
    return this.nameStepTouched() && this.nameError() === '';
  });

  // Can create server check
  canCreateServer = computed(() => 
    this.isArchitectureComplete() && 
    this.isLocationComplete() && 
    this.isImageComplete() &&
    this.isNameComplete()
  );

  // ============================================================================
  // STEP COMPLETION METHODS
  // ============================================================================
  isStepCompleted(step: string): boolean {
    switch (step) {
      case 'architecture': return this.isArchitectureComplete();
      case 'location': return this.isLocationComplete();
      case 'image': return this.isImageComplete();
      case 'networking': return this.isNetworkingComplete();
      case 'security': return this.isSecurityComplete();
      case 'extras': return this.isBackupsComplete();
      case 'labels': return this.isLabelsComplete();
      case 'name': return this.isNameComplete();
      default: return false;
    }
  }

  // ============================================================================
  // NAVIGATION METHODS
  // ============================================================================
  scrollToStep(stepId: WizardStep): void {
    const element = document.getElementById(stepId);
    const mainContent = document.querySelector('.wizard-main');
    
    if (element && mainContent) {
      const elementTop = element.offsetTop;
      const headerHeight = 100;
      const scrollPosition = elementTop - headerHeight;
      
      mainContent.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
      
      setTimeout(() => {
        this.activeSection.set(stepId);
      }, 100);
    }
  }

  isSectionActive(stepId: WizardStep): boolean {
    return this.activeSection() === stepId;
  }

  // ============================================================================
  // WIZARD RESET
  // ============================================================================
  resetWizard(): void {
    this.selectedArchitecture.set('');
    this.selectedCpuArchitecture.set('x86');
    this.selectedLocation.set('');
    this.selectedImage.set('');
    this.selectedServerType.set('');
    this.activeImageTab.set('os');
    this.enableBackups.set(false);
    this.enablePublicIPv4.set(true);
    this.enablePublicIPv6.set(true);
    this.selectedBackupWindow.set('22-02');
    this.selectedFirewalls.set([]);
    this.serverLabels.set([]);
    this.labelsTextarea.set('');
    this.serverName.set('');
    this.nameError.set('');
    this.nameStepTouched.set(false);
  }

  // ============================================================================
  // PERSISTENCE METHODS
  // ============================================================================
  loadPersistedSelections(): void {
    this.loadFirewallSelection();
  }

  private loadFirewallSelection(): void {
    const saved = sessionStorage.getItem('selectedFirewalls');
    if (saved) {
      try {
        const selectedIds = JSON.parse(saved);
        if (Array.isArray(selectedIds)) {
          this.selectedFirewalls.set(selectedIds);
        }
      } catch (e) {
        console.warn('Failed to parse saved firewall selection');
      }
    }
  }

  persistFirewallSelection(): void {
    const selectedIds = this.selectedFirewalls();
    sessionStorage.setItem('selectedFirewalls', JSON.stringify(selectedIds));
  }

  // ============================================================================
  // NAME STEP METHODS
  // ============================================================================
  markNameStepTouched(): void {
    this.nameStepTouched.set(true);
  }
}