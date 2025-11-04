import { Injectable } from '@angular/core';

/**
 * Utility service for server name validation and generation
 */
@Injectable({
  providedIn: 'root'
})
export class ServerNameValidator {

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================
  validateServerName(name: string): string {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return '';
    }
    
    if (trimmedName.length < 3 || trimmedName.length > 63) {
      return 'Name must be 3-63 characters long';
    }
    
    const validPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
    if (!validPattern.test(trimmedName)) {
      return 'Name must contain only alphanumeric characters and hyphens';
    }
    
    return '';
  }

  // ============================================================================
  // NAME GENERATION
  // ============================================================================
  generateServerName(
    selectedImage: string, 
    selectedLocation: string, 
    memory: number
  ): string {
    const image = selectedImage || 'server';
    const location = selectedLocation || 'dc';
    const datacenterId = Math.floor(Math.random() * 9) + 1;
    
    return `${image}-${memory}gb-${location}-${datacenterId}`;
  }
}