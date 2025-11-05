import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Activity, ActivitiesData, ActivityStatus, ActivityCategory } from './models/activity.model';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private http = inject(HttpClient);
  
  // Local state
  private activitiesData = signal<ActivitiesData | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.loadActivitiesData();
  }

  private async loadActivitiesData(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);
      
      const data = await this.http.get<ActivitiesData>('/assets/mock/activities.json').toPromise();
      this.activitiesData.set(data || null);
    } catch (err) {
      console.error('Failed to load activities data:', err);
      this.error.set('Failed to load activities data');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Get activities for a specific server
   */
  getServerActivities(serverId: number | string): Activity[] {
    const data = this.activitiesData();
    if (!data) return [];
    
    const serverIdStr = String(serverId);
    return data.serverActivities[serverIdStr] || [];
  }

  /**
   * Get recent activities for a server (last N activities)
   */
  getRecentServerActivities(serverId: number | string, limit: number = 10): Activity[] {
    const activities = this.getServerActivities(serverId);
    
    // Sort by timestamp (newest first) and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get activities by category
   */
  getActivitiesByCategory(serverId: number | string, category: ActivityCategory): Activity[] {
    const activities = this.getServerActivities(serverId);
    return activities.filter(activity => activity.category === category);
  }

  /**
   * Get activities by status
   */
  getActivitiesByStatus(serverId: number | string, status: ActivityStatus): Activity[] {
    const activities = this.getServerActivities(serverId);
    return activities.filter(activity => activity.status === status);
  }

  /**
   * Add a new activity for a server
   */
  addActivity(serverId: number | string, activity: Omit<Activity, 'id' | 'timestamp'>): void {
    const data = this.activitiesData();
    if (!data) return;

    const serverIdStr = String(serverId);
    const newActivity: Activity = {
      ...activity,
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    if (!data.serverActivities[serverIdStr]) {
      data.serverActivities[serverIdStr] = [];
    }

    data.serverActivities[serverIdStr].unshift(newActivity);
    this.activitiesData.set({ ...data });
  }

  /**
   * Get activity type configuration
   */
  getActivityTypeConfig(activityType: string) {
    const data = this.activitiesData();
    if (!data) return null;
    
    return data.activityTypes[activityType] || null;
  }

  /**
   * Format relative time for activity display
   */
  getRelativeTime(timestamp: string): string {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMonths > 0) {
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    } else if (diffWeeks > 0) {
      return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    } else if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  /**
   * Get CSS classes for activity status
   */
  getStatusClasses(status: ActivityStatus): string {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200`;
      case 'in_progress':
        return `${baseClasses} bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200`;
      case 'failed':
        return `${baseClasses} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200`;
      case 'warning':
        return `${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200`;
      case 'pending':
        return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300`;
      case 'cancelled':
        return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300`;
      default:
        return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300`;
    }
  }

  /**
   * Get CSS classes for activity category
   */
  getCategoryClasses(category: ActivityCategory): string {
    const baseClasses = 'w-3 h-3 rounded-full flex-shrink-0';
    
    switch (category) {
      case 'lifecycle':
        return `${baseClasses} bg-blue-500`;
      case 'power':
        return `${baseClasses} bg-green-500`;
      case 'backup':
        return `${baseClasses} bg-purple-500`;
      case 'security':
        return `${baseClasses} bg-red-500`;
      case 'configuration':
        return `${baseClasses} bg-yellow-500`;
      case 'monitoring':
        return `${baseClasses} bg-orange-500`;
      case 'maintenance':
        return `${baseClasses} bg-indigo-500`;
      case 'networking':
        return `${baseClasses} bg-cyan-500`;
      case 'storage':
        return `${baseClasses} bg-pink-500`;
      case 'scaling':
        return `${baseClasses} bg-emerald-500`;
      case 'authentication':
        return `${baseClasses} bg-violet-500`;
      default:
        return `${baseClasses} bg-gray-500`;
    }
  }
}