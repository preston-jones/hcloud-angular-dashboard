import { TestBed } from '@angular/core/testing';
import { SearchService } from './search.service';

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty search query', () => {
    expect(service.searchQuery()).toBe('');
  });

  it('should set search query', () => {
    const testQuery = 'test-server';
    service.setQuery(testQuery);
    expect(service.searchQuery()).toBe(testQuery);
  });

  it('should clear search query', () => {
    service.setQuery('test-server');
    service.clearQuery();
    expect(service.searchQuery()).toBe('');
  });
});