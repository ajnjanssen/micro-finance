export interface SavingsGoal {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  categoryId?: string; // Link to expense category for tracking
  deadline?: string; // Target date to reach goal
  priority: "low" | "medium" | "high";
  imageUrl?: string; // Primary product image (for backward compatibility)
  imageUrls?: string[]; // Multiple product images
  sourceUrl?: string; // Original product URL
  monthlyContribution?: number; // How much to save per month
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoalsData {
  goals: SavingsGoal[];
  lastUpdated: string;
}

export interface UrlMetadata {
  title: string;
  description?: string;
  price?: number;
  image?: string;
  images?: string[]; // Multiple images from listing
  currency?: string;
}
