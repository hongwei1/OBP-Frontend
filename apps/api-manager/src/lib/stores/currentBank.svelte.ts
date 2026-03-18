import { browser } from "$app/environment";
import { createLogger } from "$lib/utils/logger";
import { trackedFetch } from "$lib/utils/trackedFetch";

const logger = createLogger("CurrentBank");

const STORAGE_KEY = "currentBank";

export interface Bank {
  bank_id: string;
  bank_code?: string;
  short_name?: string;
  full_name?: string;
  logo?: string;
  website?: string;
  bank_routings?: { scheme: string; address: string }[];
  attributes?: { name: string; value: string }[];
}

class CurrentBankStore {
  bank = $state<Bank | null>(null);
  banks = $state<Bank[]>([]);
  loading = $state(false);
  justChanged = $state(false);
  private changeTimer: ReturnType<typeof setTimeout> | null = null;

  get bankId(): string {
    return this.bank?.bank_id ?? "";
  }

  constructor() {
    if (browser) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.bank = JSON.parse(stored);
          logger.info(`Restored bank from localStorage: ${this.bank?.bank_id}`);
        }
      } catch (e) {
        logger.error("Failed to restore bank from localStorage:", e);
      }
    }
  }

  select(bank: Bank | null): void {
    this.bank = bank;
    if (browser) {
      if (bank) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bank));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    logger.info(`Selected bank: ${bank?.bank_id ?? "none"}`);

    // Trigger the highlight animation
    if (bank && browser) {
      if (this.changeTimer) clearTimeout(this.changeTimer);
      this.justChanged = true;
      this.changeTimer = setTimeout(() => {
        this.justChanged = false;
      }, 1500);
    }
  }

  selectById(bankId: string): void {
    if (!bankId) {
      this.select(null);
      return;
    }
    const bank = this.banks.find((b) => b.bank_id === bankId);
    if (bank) {
      this.select(bank);
    } else {
      logger.warn(`Bank not found: ${bankId}`);
    }
  }

  private fetchPromise: Promise<Bank[]> | null = null;

  async fetchBanks(): Promise<Bank[]> {
    if (this.banks.length > 0) {
      return this.banks;
    }

    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = this._doFetch();
    return this.fetchPromise;
  }

  private async _doFetch(): Promise<Bank[]> {
    try {
      this.loading = true;
      const response = await trackedFetch("/api/banks");

      if (!response.ok) {
        throw new Error("Failed to fetch banks");
      }

      const data = await response.json();
      this.banks = (data.banks || [])
        .filter((b: Bank) => b.bank_id != null)
        .sort((a: Bank, b: Bank) => a.bank_id.localeCompare(b.bank_id));

      logger.info(`Fetched ${this.banks.length} banks`);

      // Refresh stored bank with full data from API
      if (this.bank) {
        const freshBank = this.banks.find(
          (b) => b.bank_id === this.bank!.bank_id,
        );
        if (freshBank) {
          this.select(freshBank);
        } else {
          logger.warn(
            `Stored bank ${this.bank.bank_id} no longer exists, clearing`,
          );
          this.select(null);
        }
      }

      // Auto-select first bank if none is set
      if (!this.bank && this.banks.length > 0) {
        logger.info(`No bank selected, defaulting to first: ${this.banks[0].bank_id}`);
        this.select(this.banks[0]);
      }

      return this.banks;
    } catch (error) {
      logger.error("Error fetching banks:", error);
      return [];
    } finally {
      this.loading = false;
      this.fetchPromise = null;
    }
  }

  clear(): void {
    this.select(null);
    this.banks = [];
    logger.info("Cleared current bank and bank list");
  }
}

export const currentBank = new CurrentBankStore();
