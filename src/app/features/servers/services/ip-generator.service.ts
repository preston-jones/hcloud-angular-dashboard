import { Injectable } from '@angular/core';

/**
 * Service for generating mock IP addresses for server creation
 */
@Injectable({
  providedIn: 'root'
})
export class IpGeneratorService {

  generateIPv4(serverId: number): any {
    const ip = this.generateRandomIPv4();
    return {
      id: serverId + 1000,
      ip: ip,
      blocked: false,
      dns_ptr: `static.${ip.split('.').reverse().join('.')}.clients.your-server.de`
    };
  }

  generateIPv6(serverId: number): any {
    return {
      id: serverId + 2000,
      ip: this.generateRandomIPv6(),
      blocked: false,
      dns_ptr: []
    };
  }

  private generateRandomIPv4(): string {
    const ranges = [[37, 27], [88, 198], [95, 217], [78, 46]];
    const range = ranges[Math.floor(Math.random() * ranges.length)];
    const third = Math.floor(Math.random() * 256);
    const fourth = Math.floor(Math.random() * 254) + 1;
    
    return `${range[0]}.${range[1]}.${third}.${fourth}`;
  }

  private generateRandomIPv6(): string {
    const prefixes = ['2a01:4f8', '2a01:4f9'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const subnet = Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0');
    
    return `${prefix}:c012:${subnet}::/64`;
  }
}