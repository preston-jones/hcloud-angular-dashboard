import { Injectable } from '@angular/core';
import { ServerLabel } from '../../../core/models';

/**
 * Utility service for parsing and validating server labels
 */
@Injectable({
  providedIn: 'root'
})
export class LabelParser {

  // ============================================================================
  // LABEL PARSING METHODS
  // ============================================================================
  parseLabelsFromText(text: string): ServerLabel[] {
    const trimmedText = text.trim();
    if (!trimmedText) {
      return [];
    }

    const lines = trimmedText.split('\n');
    const validLabels: ServerLabel[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || !trimmedLine.includes('=')) continue;

      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=').trim();
      
      if (key.trim() && value) {
        const trimmedKey = key.trim();
        if (!validLabels.some(label => label.key === trimmedKey)) {
          validLabels.push({ key: trimmedKey, value });
        }
      }
    }

    return validLabels;
  }

  // ============================================================================
  // LABEL CONVERSION METHODS
  // ============================================================================
  convertLabelsToObject(labels: ServerLabel[]): Record<string, string> {
    const labelObject: Record<string, string> = {};
    labels.forEach(label => {
      labelObject[label.key] = label.value;
    });
    return labelObject;
  }
}