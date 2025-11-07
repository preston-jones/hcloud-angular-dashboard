import { Injectable, computed, signal } from '@angular/core';
import { ServerTemplate } from '../../../core/models';

/**
 * Service for handling all pricing calculations and cost computations
 */
@Injectable({
  providedIn: 'root'
})
export class PricingCalculatorService {

  // Dependencies will be injected via method parameters to avoid circular dependencies
  
  // ============================================================================
  // PRICING CALCULATION METHODS
  // ============================================================================
  calculateServerPrice(
    filteredServerTypes: ServerTemplate[], 
    selectedServerType: string, 
    selectedLocation: string
  ): string {
    if (!selectedServerType || !filteredServerTypes) return '0.00';
    
    const server = filteredServerTypes.find(s => s.server_type?.name === selectedServerType);
    if (!server?.server_type?.prices?.length) return '0.00';
    
    const locationPrice = server.server_type.prices.find(p => 
      p.location === selectedLocation
    );
    const price = locationPrice || server.server_type.prices[0];
    
    return price?.price_monthly?.gross || '0.00';
  }

  calculateBackupPrice(basePrice: string): string {
    const price = parseFloat(basePrice);
    return (price * 0.2).toFixed(2);
  }

  calculateTotalPrice(basePrice: string, enableBackups: boolean): string {
    const price = parseFloat(basePrice);
    const backupCost = enableBackups ? parseFloat(this.calculateBackupPrice(basePrice)) : 0;
    return (price + backupCost).toFixed(2);
  }

  // ============================================================================
  // SERVER MEMORY EXTRACTION
  // ============================================================================
  getSelectedServerMemory(filteredServerTypes: ServerTemplate[], selectedServerType: string): number {
    const server = filteredServerTypes.find(s => s.server_type?.name === selectedServerType);
    return server?.server_type?.memory || 4;
  }
}