// frontend/src/components/features/projects/BudgetProgress.jsx
// Story 3.7: Admin Management UI - Projects

/**
 * Budget progress visualization component
 * Shows a progress bar with hours tracked vs budget
 *
 * @param {Object} props
 * @param {number|null} props.budgetHours - Total budget hours (null if no budget)
 * @param {number} props.trackedHours - Hours already tracked
 * @param {boolean} [props.compact=false] - Compact display mode
 */
export function BudgetProgress({ budgetHours, trackedHours = 0, compact = false }) {
  // No budget set
  if (budgetHours === null || budgetHours === undefined) {
    return (
      <span className="text-gray-500 text-sm">
        {compact ? '-' : 'Pas de budget'}
      </span>
    );
  }

  const percentage = budgetHours > 0 ? Math.min((trackedHours / budgetHours) * 100, 100) : 0;
  const isOverBudget = trackedHours > budgetHours;
  const overPercentage = isOverBudget ? ((trackedHours - budgetHours) / budgetHours) * 100 : 0;

  // Determine color based on percentage
  let barColor = 'bg-green-500';
  if (percentage >= 90 || isOverBudget) {
    barColor = 'bg-red-500';
  } else if (percentage >= 75) {
    barColor = 'bg-yellow-500';
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <span className={`text-xs ${isOverBudget ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
          {Math.round(percentage)}%
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Budget: {trackedHours}h / {budgetHours}h
          {isOverBudget && (
            <span className="text-red-600 ml-1">
              (+{(trackedHours - budgetHours).toFixed(1)}h)
            </span>
          )}
        </span>
        <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {isOverBudget && (
        <p className="text-xs text-red-600">
          Depassement de {overPercentage.toFixed(0)}% du budget
        </p>
      )}
    </div>
  );
}

export default BudgetProgress;
