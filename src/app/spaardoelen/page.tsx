"use client";

import { useState, useEffect } from "react";
import { SavingsGoal, UrlMetadata } from "@/types/savings-goals";
import { Category } from "@/types/finance";
import { SAVINGS_TRANSACTION_PATTERNS } from "@/constants/categories";

// Helper function to detect savings transactions (mirrors CategoryService logic)
function isSavingsTransaction(description: string): boolean {
  if (!description) return false;

  const desc = description.toLowerCase();
  const { keywords, shortKeyword, shortKeywordMaxLength } =
    SAVINGS_TRANSACTION_PATTERNS;

  // Check for exact keywords
  for (const keyword of keywords) {
    if (desc.includes(keyword)) return true;
  }

  // Check for short "sparen" descriptions
  if (desc.includes(shortKeyword) && desc.length < shortKeywordMaxLength) {
    return true;
  }

  return false;
}

export default function SpaardoelenPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [extractingUrl, setExtractingUrl] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    url: "",
    name: "",
    description: "",
    targetAmount: 0,
    currentAmount: 0,
    monthlyContribution: 0,
    deadline: "",
    priority: "medium" as "low" | "medium" | "high",
    categoryId: "",
    imageUrl: "",
    sourceUrl: "",
  });

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [availableSavings, setAvailableSavings] = useState(0);
  const [oldSavingsTransactions, setOldSavingsTransactions] = useState<any[]>(
    []
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        goalsResponse,
        categoriesResponse,
        budgetResponse,
        financeResponse,
      ] = await Promise.all([
        fetch("/api/savings-goals"),
        fetch("/api/settings/categories"),
        fetch("/api/finance/budget"),
        fetch("/api/finance"),
      ]);

      const goalsData = await goalsResponse.json();
      const categoriesData = await categoriesResponse.json();
      const budgetData = await budgetResponse.json();
      const financeData = await financeResponse.json();

      setGoals(goalsData.goals || []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);

      // Calculate available savings from budget
      if (budgetData.savings) {
        const available =
          budgetData.savings.target - budgetData.savings.planned;
        setAvailableSavings(Math.max(0, available));
      }

      // Check for old savings transactions that should be deleted
      const savingsTransactions = (financeData.transactions || []).filter(
        (t: any) => t.isRecurring && isSavingsTransaction(t.description)
      );
      setOldSavingsTransactions(savingsTransactions);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const extractFromUrl = async () => {
    if (!formData.url) return;

    setExtractingUrl(true);
    try {
      const response = await fetch("/api/extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formData.url }),
      });

      if (response.ok) {
        const metadata: UrlMetadata = await response.json();
        console.log("Received metadata:", metadata);

        // Set images
        if (metadata.images && metadata.images.length > 0) {
          setImageUrls(metadata.images);
          setSelectedImageIndex(0);
        }

        setFormData({
          ...formData,
          name: metadata.title || formData.name,
          description: metadata.description || formData.description,
          targetAmount: metadata.price || formData.targetAmount,
          imageUrl: metadata.images?.[0] || metadata.image || formData.imageUrl,
          sourceUrl: formData.url,
        });

        // Show feedback
        const extractedFields = [];
        if (metadata.title) extractedFields.push("naam");
        if (metadata.description) extractedFields.push("beschrijving");
        if (metadata.price) extractedFields.push("prijs");
        if (metadata.images)
          extractedFields.push(`${metadata.images.length} afbeeldingen`);

        if (extractedFields.length > 0) {
          alert(`✓ Opgehaald: ${extractedFields.join(", ")}`);
        } else {
          alert("Geen gegevens gevonden. Probeer een andere URL.");
        }
      } else {
        const error = await response.json();
        alert(
          `Kon geen informatie ophalen: ${error.error || "Onbekende fout"}`
        );
      }
    } catch (error) {
      console.error("Error extracting URL:", error);
      alert("Fout bij ophalen URL informatie");
    } finally {
      setExtractingUrl(false);
    }
  };

  const calculateDeadline = (
    targetAmount: number,
    currentAmount: number,
    monthlyContribution: number
  ): string => {
    if (!monthlyContribution || monthlyContribution <= 0) return "";
    const remaining = targetAmount - currentAmount;
    if (remaining <= 0) return new Date().toISOString().split("T")[0];

    const monthsNeeded = Math.ceil(remaining / monthlyContribution);
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + monthsNeeded);
    return deadline.toISOString().split("T")[0];
  };

  const updateFormWithDeadline = (updates: Partial<typeof formData>) => {
    const newData = { ...formData, ...updates };

    // Auto-calculate deadline
    if (newData.targetAmount && newData.monthlyContribution) {
      newData.deadline = calculateDeadline(
        newData.targetAmount,
        newData.currentAmount,
        newData.monthlyContribution
      );
    }

    setFormData(newData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Find savings category
    const savingsCategory = categories.find((c) =>
      c.name.toLowerCase().includes("spaar")
    );

    const goal: Partial<SavingsGoal> = {
      ...formData,
      id: editingGoal?.id,
      categoryId: savingsCategory?.id || formData.categoryId,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      createdAt: editingGoal?.createdAt,
      updatedAt: new Date().toISOString(),
    };

    try {
      const url = editingGoal
        ? `/api/savings-goals/${editingGoal.id}`
        : "/api/savings-goals";
      const method = editingGoal ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goal),
      });

      if (response.ok) {
        await loadData();
        resetForm();
      }
    } catch (error) {
      console.error("Error saving goal:", error);
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm("Weet je zeker dat je dit spaardoel wilt verwijderen?"))
      return;

    try {
      const response = await fetch(`/api/savings-goals/${goalId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      url: "",
      name: "",
      description: "",
      targetAmount: 0,
      currentAmount: 0,
      monthlyContribution: 0,
      deadline: "",
      priority: "medium",
      categoryId: "",
      imageUrl: "",
      sourceUrl: "",
    });
    setEditingGoal(null);
    setShowForm(false);
  };

  const calculateMonthsToGoal = (goal: SavingsGoal): number => {
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) return 0;
    if (!goal.monthlyContribution || goal.monthlyContribution <= 0)
      return Infinity;
    return Math.ceil(remaining / goal.monthlyContribution);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getProgressPercentage = (goal: SavingsGoal): number => {
    if (!goal.targetAmount || goal.targetAmount <= 0) return 0;
    return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "badge-error";
      case "medium":
        return "badge-warning";
      case "low":
        return "badge-info";
      default:
        return "badge-ghost";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Hoog";
      case "medium":
        return "Gemiddeld";
      case "low":
        return "Laag";
      default:
        return priority;
    }
  };

  // Goal Card Component with Carousel
  const GoalCard = ({
    goal,
    onEdit,
    onDelete,
  }: {
    goal: SavingsGoal;
    onEdit: (goal: SavingsGoal) => void;
    onDelete: (id: string) => void;
  }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const goalImages = goal.imageUrls || (goal.imageUrl ? [goal.imageUrl] : []);
    const progress = getProgressPercentage(goal);
    const monthsLeft = calculateMonthsToGoal(goal);

    return (
      <div className="card bg-base-100 shadow-xl">
        {goalImages.length > 0 && (
          <figure className="overflow-hidden relative group aspect-square">
            <img
              src={goalImages[currentImageIndex]}
              alt={goal.name}
              className="w-full h-full object-cover"
            />

            {/* Carousel Controls */}
            {goalImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(
                      (currentImageIndex - 1 + goalImages.length) %
                        goalImages.length
                    );
                  }}
                  className="btn btn-circle btn-sm absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ❮
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(
                      (currentImageIndex + 1) % goalImages.length
                    );
                  }}
                  className="btn btn-circle btn-sm absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ❯
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-2 right-2 bg-base-100/80 px-2 py-1 rounded text-xs font-semibold">
                  {currentImageIndex + 1}/{goalImages.length}
                </div>
              </>
            )}
          </figure>
        )}
        <div className="card-body">
          <h2 className="card-title">
            {goal.name}
            <span className={`badge ${getPriorityColor(goal.priority)}`}>
              {getPriorityLabel(goal.priority)}
            </span>
          </h2>

          {goal.description && (
            <p className="text-sm text-base-content/70 line-clamp-2">
              {goal.description}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Voortgang</span>
              <span className="font-semibold">
                {isNaN(progress) ? "0" : progress.toFixed(0)}%
              </span>
            </div>
            <progress
              className="progress progress-primary w-full"
              value={isNaN(progress) ? 0 : progress}
              max="100"
            ></progress>
            <div className="flex justify-between text-xs text-base-content/60">
              <span>{formatCurrency(goal.currentAmount)}</span>
              <span>{formatCurrency(goal.targetAmount)}</span>
            </div>
          </div>

          {goal.monthlyContribution && goal.monthlyContribution > 0 && (
            <div className="alert alert-info text-sm">
              <div>
                <div className="font-semibold">
                  {formatCurrency(goal.monthlyContribution)}/maand
                </div>
                {monthsLeft !== Infinity && (
                  <div className="text-xs">
                    {monthsLeft === 0
                      ? "Doel bereikt! 🎉"
                      : `Nog ${monthsLeft} ${
                          monthsLeft === 1 ? "maand" : "maanden"
                        }`}
                  </div>
                )}
              </div>
            </div>
          )}

          {goal.deadline && (
            <div className="text-xs text-base-content/60">
              Deadline: {new Date(goal.deadline).toLocaleDateString("nl-NL")}
            </div>
          )}

          {goal.sourceUrl && (
            <a
              href={goal.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-ghost"
            >
              🔗 Bekijk product
            </a>
          )}

          <div className="card-actions justify-end">
            <button
              onClick={() => onEdit(goal)}
              className="btn btn-sm btn-primary"
            >
              Bewerken
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="btn btn-sm btn-error"
            >
              Verwijderen
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-base-300 rounded w-1/4"></div>
          <div className="h-64 bg-base-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-base-content">Spaardoelen</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? "Annuleren" : "+ Nieuw Spaardoel"}
          </button>
        </div>

        {/* Warning for old savings transactions */}
        {oldSavingsTransactions.length > 0 && (
          <div className="alert alert-warning mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="font-bold">Oude Spaardoel Transacties Gevonden</h3>
              <div className="text-sm">
                Je hebt {oldSavingsTransactions.length} oude "Spaardoel"
                transactie(s) die nu worden vervangen door dit systeem.
                <br />
                Verwijder deze via de{" "}
                <a
                  href="/transactions"
                  className="link link-hover font-semibold"
                >
                  Transacties pagina
                </a>{" "}
                om dubbele berekeningen te voorkomen:
                <ul className="list-disc list-inside mt-2">
                  {oldSavingsTransactions.map((tx: any) => (
                    <li key={tx.id}>
                      {tx.description} - €{Math.abs(tx.amount).toFixed(2)}/maand
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingGoal ? "Bewerk Spaardoel" : "Nieuw Spaardoel"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* URL Input with Extract Button */}
              <div>
                <label className="label">
                  <span className="label-text">
                    URL (optioneel - bijvoorbeeld Marktplaats)
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    className="input input-bordered flex-1"
                    placeholder="https://www.marktplaats.nl/..."
                  />
                  <button
                    type="button"
                    onClick={extractFromUrl}
                    disabled={!formData.url || extractingUrl}
                    className="btn btn-secondary"
                  >
                    {extractingUrl ? (
                      <span className="loading loading-spinner"></span>
                    ) : (
                      "Ophalen"
                    )}
                  </button>
                </div>
                <p className="text-xs text-base-content/60 mt-1">
                  Plak een URL om automatisch productinformatie op te halen
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">Naam *</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Doel Bedrag *</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.targetAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetAmount: parseFloat(e.target.value),
                      })
                    }
                    className="input input-bordered w-full"
                    required
                  />
                </div>
              </div>

              {/* Sliders for Monthly Contribution */}
              <div className="space-y-4">
                {/* Show available budget info */}
                <div className="alert alert-info">
                  <i className="text-2xl">💰</i>
                  <div>
                    <div className="font-semibold">Beschikbaar Budget</div>
                    <div className="text-sm">
                      Je kunt maximaal € {availableSavings.toFixed(2)} per maand
                      sparen
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Maandelijks Sparen</span>
                    <span className="label-text-alt font-semibold">
                      € {formData.monthlyContribution.toFixed(2)}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={availableSavings || 500}
                    step="5"
                    value={formData.monthlyContribution}
                    onChange={(e) =>
                      updateFormWithDeadline({
                        monthlyContribution: parseFloat(e.target.value),
                      })
                    }
                    className="range range-secondary"
                  />
                  <div className="w-full flex justify-between text-xs px-2 text-base-content/60">
                    <span>€ 0</span>
                    <span>€ {(availableSavings || 500).toFixed(0)}</span>
                  </div>
                  <p className="text-xs text-base-content/60 mt-2">
                    Gebaseerd op je SAVINGS budget: €{" "}
                    {availableSavings.toFixed(2)} beschikbaar
                  </p>
                </div>

                {/* Calculated Deadline - Read Only */}
                {formData.deadline && (
                  <div className="alert alert-success">
                    <i className="text-2xl">🎯</i>
                    <div>
                      <div className="font-semibold">Doel bereikt op:</div>
                      <div>
                        {new Date(formData.deadline).toLocaleDateString(
                          "nl-NL",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Beschrijving</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="textarea textarea-bordered w-full"
                  rows={3}
                />
              </div>

              {/* Image Selection Grid */}
              {imageUrls.length > 0 && (
                <div>
                  <label className="label">
                    <span className="label-text">
                      Afbeeldingen ({imageUrls.length}) - Klik om te verwijderen
                    </span>
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {imageUrls.map((url, index) => (
                      <div
                        key={index}
                        className="relative group aspect-square bg-base-300 rounded-lg overflow-hidden border-2 hover:border-error cursor-pointer transition-all"
                        onClick={() => {
                          const newUrls = imageUrls.filter(
                            (_, i) => i !== index
                          );
                          setImageUrls(newUrls);
                          if (
                            index === selectedImageIndex &&
                            newUrls.length > 0
                          ) {
                            setSelectedImageIndex(0);
                            setFormData({ ...formData, imageUrl: newUrls[0] });
                          } else if (newUrls.length === 0) {
                            setFormData({ ...formData, imageUrl: "" });
                          }
                        }}
                      >
                        <img
                          src={url}
                          alt={`Afbeelding ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-error/0 group-hover:bg-error/70 transition-all flex items-center justify-center">
                          <span className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                            ✕
                          </span>
                        </div>
                        {index === selectedImageIndex && (
                          <div className="absolute top-1 right-1 bg-primary text-primary-content rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            ✓
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-base-content/60 mt-2">
                    Klik op een afbeelding om deze te verwijderen. Het eerste
                    vinkje is de hoofdafbeelding.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">
                  {editingGoal ? "Bijwerken" : "Aanmaken"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-ghost"
                >
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-base-content/60 mb-4">
              Je hebt nog geen spaardoelen
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              Maak je eerste spaardoel
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={(goal) => {
                  setEditingGoal(goal);
                  setFormData({
                    url: goal.sourceUrl || "",
                    name: goal.name,
                    description: goal.description || "",
                    targetAmount: goal.targetAmount,
                    currentAmount: goal.currentAmount,
                    monthlyContribution: goal.monthlyContribution || 0,
                    deadline: goal.deadline || "",
                    priority: goal.priority,
                    categoryId: goal.categoryId || "",
                    imageUrl: goal.imageUrl || "",
                    sourceUrl: goal.sourceUrl || "",
                  });
                  if (goal.imageUrls) {
                    setImageUrls(goal.imageUrls);
                    setSelectedImageIndex(0);
                  }
                  setShowForm(true);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
