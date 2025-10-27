import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { ServerDetailPage } from './server-detail-page';
import { HetznerApiService } from '../../../core/hetzner-api.service';

describe('ServerDetailPage', () => {
  let component: ServerDetailPage;
  let fixture: ComponentFixture<ServerDetailPage>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockApiService: jasmine.SpyObj<HetznerApiService>;

  beforeEach(async () => {
    const routeSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { paramMap: { get: jasmine.createSpy().and.returnValue('test-id') } }
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const apiSpy = jasmine.createSpyObj('HetznerApiService', ['loadServers', 'getCountryFlag', 'hasCountryData'], {
      servers: jasmine.createSpy().and.returnValue([])
    });

    await TestBed.configureTestingModule({
      imports: [ServerDetailPage],
      providers: [
        { provide: ActivatedRoute, useValue: routeSpy },
        { provide: Router, useValue: routerSpy },
        { provide: HetznerApiService, useValue: apiSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ServerDetailPage);
    component = fixture.componentInstance;
    mockActivatedRoute = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockApiService = TestBed.inject(HetznerApiService) as jasmine.SpyObj<HetznerApiService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should extract server ID from route params on init', () => {
    component.ngOnInit();
    expect(component.serverId()).toBe('test-id');
  });

  it('should navigate back to servers list', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servers']);
  });
});