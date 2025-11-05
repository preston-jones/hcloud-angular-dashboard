import { ChangeDetectionStrategy, Component, computed, signal, inject, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HetznerApiService } from '../../../core/hetzner-api.service';
import {
  Server,
  ServerArchitecture,
  CpuArchitecture,
  ImageTab,
  BackupWindow,
  ServerLabel,
  WizardStep,
  ServerToCreate
} from '../../../core/models';
import {
  WizardStateService,
  DataMappingService,
  PricingCalculatorService,
  ServerNameValidator,
  LabelParser,
  IpGeneratorService
} from '../services';
import {
  WizardStepArchitecture,
  WizardStepLocation,
  WizardStepImage,
  WizardStepNetworking,
  WizardStepSecurity,
  WizardStepExtras,
  WizardStepLabels,
  WizardStepName
} from '../components';
import { DemoRestrictionDialogComponent } from '../../../shared/ui/demo-restriction-dialog/demo-restriction-dialog'; @Component({
  selector: 'app-servers-page',
  imports: [
    FormsModule,
    WizardStepArchitecture,
    WizardStepLocation,
    WizardStepImage,
    WizardStepNetworking,
    WizardStepSecurity,
    WizardStepExtras,
    WizardStepLabels,
    WizardStepName,
    DemoRestrictionDialogComponent
  ],
  templateUrl: './servers-page.html',
  styleUrls: ['./servers-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServersPage implements OnInit, OnDestroy, AfterViewInit {
  private api = inject(HetznerApiService);
  private router = inject(Router);
  private wizardState = inject(WizardStateService);
  private dataMapping = inject(DataMappingService);
  private pricingCalculator = inject(PricingCalculatorService);
  private nameValidator = inject(ServerNameValidator);
  private labelParser = inject(LabelParser);
  private ipGenerator = inject(IpGeneratorService);

  // ============================================================================
  // UI STATE (Component-specific)
  // ============================================================================
  private scrollEventListener?: () => void;
  showDemoRestriction = signal(false);

  // ============================================================================
  // DATA ACCESS FROM SERVICE
  // ============================================================================
  serverTypes = computed(() => this.api.availableServerTypes());
  locations = computed(() => this.api.locations());
  images = computed(() => this.api.images());
  firewalls = computed(() => this.api.firewalls());
  loading = computed(() => this.api.loading());
  error = computed(() => this.api.error());

  // ============================================================================
  // COMPUTED DATA (using services)
  // ============================================================================

  // Pricing calculations using service
  serverPrice = computed(() => this.pricingCalculator.calculateServerPrice(
    this.serverTypes(),
    this.wizardState.selectedServerType(),
    this.wizardState.selectedLocation()
  ));

  backupPrice = computed(() => this.pricingCalculator.calculateBackupPrice(this.serverPrice()));

  totalPrice = computed(() => this.pricingCalculator.calculateTotalPrice(
    this.serverPrice(),
    this.wizardState.enableBackups()
  ));

  // ============================================================================
  // LIFECYCLE METHODS
  // ============================================================================

  ngOnInit(): void {
    this.loadInitialData();
    this.wizardState.loadPersistedSelections();
  }

  ngOnDestroy(): void {
    this.cleanupScrollSpy();
  }

  ngAfterViewInit(): void {
    this.setupScrollSpy();
  }

  // ============================================================================
  // DATA LOADING METHODS
  // ============================================================================

  private loadInitialData(): void {
    if (!this.api.serverTypes() || !this.api.locations() || !this.api.images()) {
      this.api.retry();
    }
  }

  // ============================================================================
  // SELECTION METHODS (delegating to services)
  // ============================================================================

  selectLocation(location: string): void {
    this.wizardState.selectedLocation.set(location);
  }

  selectImage(image: string): void {
    this.wizardState.selectedImage.set(image);
  }

  setImageTab(tab: ImageTab): void {
    this.wizardState.activeImageTab.set(tab);
  }

  togglePublicIPv4(): void {
    this.wizardState.enablePublicIPv4.set(!this.wizardState.enablePublicIPv4());
  }

  togglePublicIPv6(): void {
    this.wizardState.enablePublicIPv6.set(!this.wizardState.enablePublicIPv6());
  }

  toggleFirewall(firewallId: number): void {
    const current = this.wizardState.selectedFirewalls();
    if (current.includes(firewallId)) {
      this.wizardState.selectedFirewalls.set(current.filter((id: number) => id !== firewallId));
    } else {
      this.wizardState.selectedFirewalls.set([...current, firewallId]);
    }
    this.wizardState.persistFirewallSelection();
  }

  toggleBackups(): void {
    this.wizardState.enableBackups.set(!this.wizardState.enableBackups());
  }

  selectBackupWindow(window: string): void {
    this.wizardState.selectedBackupWindow.set(window);
  }

  // ============================================================================
  // DELEGATE METHODS (using services)
  // ============================================================================

  // Wizard state delegates
  isStepCompleted = (step: string) => this.wizardState.isStepCompleted(step);
  scrollToStep = (stepId: WizardStep) => this.wizardState.scrollToStep(stepId);
  isSectionActive = (stepId: WizardStep) => this.wizardState.isSectionActive(stepId);

  // Data mapping delegates
  getLocationDisplayName = (locationCode: string) => this.dataMapping.getLocationDisplayName(locationCode);
  getLocationFlag = (locationCode: string) => this.dataMapping.getLocationFlag(locationCode);
  getImageDisplayName = (imageCode: string) => this.dataMapping.getImageDisplayName(imageCode);
  getBackupWindowLabel = () => this.dataMapping.getBackupWindowLabel(this.wizardState.selectedBackupWindow());

  // Wizard state property access (for template)
  selectedArchitecture = () => this.wizardState.selectedArchitecture();
  selectedCpuArchitecture = () => this.wizardState.selectedCpuArchitecture();
  selectedLocation = () => this.wizardState.selectedLocation();
  selectedImage = () => this.wizardState.selectedImage();
  selectedServerType = () => this.wizardState.selectedServerType();
  activeImageTab = () => this.wizardState.activeImageTab();
  enableBackups = () => this.wizardState.enableBackups();
  enablePublicIPv4 = () => this.wizardState.enablePublicIPv4();
  enablePublicIPv6 = () => this.wizardState.enablePublicIPv6();
  selectedBackupWindow = () => this.wizardState.selectedBackupWindow();
  selectedFirewalls = () => this.wizardState.selectedFirewalls();
  serverLabels = () => this.wizardState.serverLabels();
  labelsTextarea = () => this.wizardState.labelsTextarea();
  serverName = () => this.wizardState.serverName();
  nameError = () => this.wizardState.nameError();
  activeSection = () => this.wizardState.activeSection();

  // Step completion delegates
  isArchitectureComplete = () => this.wizardState.isArchitectureComplete();
  isLocationComplete = () => this.wizardState.isLocationComplete();
  isImageComplete = () => this.wizardState.isImageComplete();
  isNetworkingComplete = () => this.wizardState.isNetworkingComplete();
  isSecurityComplete = () => this.wizardState.isSecurityComplete();
  isBackupsComplete = () => this.wizardState.isBackupsComplete();
  isLabelsComplete = () => this.wizardState.isLabelsComplete();
  isNameComplete = () => this.wizardState.isNameComplete();
  canCreateServer = () => this.wizardState.canCreateServer();

  // Service computed properties
  backupWindows = () => this.dataMapping.backupWindows();

  updateLabelsTextarea(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.wizardState.labelsTextarea.set(target.value);
    const labels = this.labelParser.parseLabelsFromText(target.value);
    this.wizardState.serverLabels.set(labels);
  }

  updateServerName(event: Event): void {
    const target = event.target as HTMLInputElement;
    // Mark name step as touched when user interacts with the field
    this.wizardState.markNameStepTouched();
    this.wizardState.serverName.set(target.value);
    const error = this.nameValidator.validateServerName(target.value);
    this.wizardState.nameError.set(error);
  }

  generateServerName(): string {
    const image = this.wizardState.selectedImage() || 'server';
    const location = this.wizardState.selectedLocation() || 'dc';
    const memory = this.pricingCalculator.getSelectedServerMemory(
      this.serverTypes(),
      this.wizardState.selectedServerType()
    );
    return this.nameValidator.generateServerName(image, location, memory);
  }

  // ============================================================================
  // SCROLL SPY METHODS
  // ============================================================================

  private setupScrollSpy(): void {
    const stepIds: WizardStep[] = ['step-architecture', 'step-location', 'step-image', 'step-networking', 'step-security', 'step-extras', 'step-labels', 'step-name'];
    const scrollContainer = document.querySelector('.wizard-main') as HTMLElement;

    if (!scrollContainer) return;

    const updateActiveSection = () => {
      const scrollTop = scrollContainer.scrollTop;
      let activeStep: WizardStep = stepIds[0];

      for (let i = stepIds.length - 1; i >= 0; i--) {
        const element = document.getElementById(stepIds[i]) as HTMLElement;
        if (element && scrollTop >= element.offsetTop - 200) {
          activeStep = stepIds[i];
          break;
        }
      }

      if (activeStep !== this.wizardState.activeSection()) {
        this.wizardState.activeSection.set(activeStep);
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    this.scrollEventListener = onScroll;
    scrollContainer.addEventListener('scroll', onScroll, { passive: true });

    setTimeout(() => updateActiveSection(), 300);
  }

  private cleanupScrollSpy(): void {
    if (this.scrollEventListener) {
      const scrollContainer = document.querySelector('.wizard-main');
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', this.scrollEventListener);
      }
      this.scrollEventListener = undefined;
    }
  }

  // ============================================================================
  // SERVER CREATION METHODS
  // ============================================================================

  createServer(): void {
    if (!this.wizardState.canCreateServer()) return;

    // Check if in live mode and show demo restriction dialog
    if (this.api.mode() === 'real') {
      this.showDemoRestriction.set(true);
      return;
    }

    // Auto-generate name if none provided
    if (!this.wizardState.serverName()) {
      const generatedName = this.generateServerName();
      this.wizardState.serverName.set(generatedName);
    }

    const serverData = this.buildServerObject();
    this.saveToSessionStorage(serverData);
    this.wizardState.resetWizard();
    this.router.navigate(['/my-servers']);
        console.log(serverData)
  }

  private buildServerObject(): ServerToCreate {
    const serverId = Date.now() + Math.floor(Math.random() * 1000);
    const finalServerName = this.wizardState.serverName() || this.generateServerName();

    return {
      id: serverId,
      name: finalServerName,
      status: 'running',
      server_type: this.getSelectedServerTypeObject(),
      datacenter: this.getSelectedDatacenterObject(),
      image: this.getSelectedImageObject(),
      iso: null,
      primary_disk_size: this.getSelectedServerTypeObject()?.disk || 40,
      labels: this.labelParser.convertLabelsToObject(this.wizardState.serverLabels()),
      protection: { delete: false, rebuild: false },
      backup_window: this.wizardState.enableBackups() ? this.wizardState.selectedBackupWindow() : null,
      rescue_enabled: false,
      locked: false,
      placement_group: null,
      public_net: {
        firewalls: this.getSelectedFirewallObjects(),
        floating_ips: [],
        ipv4: this.wizardState.enablePublicIPv4() ? this.ipGenerator.generateIPv4(serverId) : null,
        ipv6: this.wizardState.enablePublicIPv6() ? this.ipGenerator.generateIPv6(serverId) : null
      },
      private_net: [],
      load_balancers: [],
      volumes: [],
      included_traffic: 21990232555520,
      ingoing_traffic: 0,
      outgoing_traffic: 0,
      created: new Date().toISOString()
    };
  }

  private getSelectedServerTypeObject(): any {
    const types = this.serverTypes();
    const selectedType = this.wizardState.selectedServerType();
    return types.find((s: any) => s.server_type?.name === selectedType)?.server_type || this.dataMapping.getDefaultServerType();
  }

  private getSelectedDatacenterObject(): any {
    const datacenters = this.api.datacenters();
    const selectedLocation = this.wizardState.selectedLocation();
    return datacenters?.find(dc => dc.location?.name === selectedLocation) || this.dataMapping.getDefaultDatacenter();
  }

  private getSelectedImageObject(): any {
    const selectedImage = this.wizardState.selectedImage();
    return this.dataMapping.getImageObjectForType(selectedImage);
  }

  private getSelectedFirewallObjects(): any[] {
    return this.wizardState.selectedFirewalls().map(id => ({
      id: id,
      status: 'applied'
    }));
  }

  private saveToSessionStorage(serverData: any): void {
    try {
      const existingServers = sessionStorage.getItem('user-servers');
      const servers = existingServers ? JSON.parse(existingServers) : [];
      servers.push(serverData);
      sessionStorage.setItem('user-servers', JSON.stringify(servers));
    } catch (error) {
      console.error('Failed to save server to session storage:', error);
    }
  }

  protected formatPrice(price: string | number | undefined): string {
    if (!price) return '0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toFixed(2);
  }
}