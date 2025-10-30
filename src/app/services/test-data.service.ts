import { Injectable } from '@angular/core';

/**
 * Service to manage test data storage and retrieval
 * Uses localStorage for data persistence across navigation
 */
@Injectable({
  providedIn: 'root'
})
export class TestDataService {
  private readonly SIEVE_DATA_KEY = 'sieve_analysis_data';
  private readonly PROCTOR_DATA_KEY = 'proctor_test_data';

  constructor() {}

  // Sieve Analysis Data Methods
  saveSieveData(data: any): void {
    localStorage.setItem(this.SIEVE_DATA_KEY, JSON.stringify(data));
  }

  getSieveData(): any {
    const data = localStorage.getItem(this.SIEVE_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }

  clearSieveData(): void {
    localStorage.removeItem(this.SIEVE_DATA_KEY);
  }

  // Proctor Test Data Methods
  saveProctorData(data: any): void {
    localStorage.setItem(this.PROCTOR_DATA_KEY, JSON.stringify(data));
  }

  getProctorData(): any {
    const data = localStorage.getItem(this.PROCTOR_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }

  clearProctorData(): void {
    localStorage.removeItem(this.PROCTOR_DATA_KEY);
  }
}
