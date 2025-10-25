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
  
  // Active period for savings
  startDate?: string; // When to start saving (YYYY-MM-DD)
  endDate?: string; // When to stop saving (YYYY-MM-DD) - when goal is reached or abandoned
  
  // Goal completion tracking
  completedDate?: string; // When the goal was reached (hit target amount)
  spentDate?: string; // When the money was actually spent on the goal
  spentTransactionId?: string; // Link to the transaction where money was spent
  
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
