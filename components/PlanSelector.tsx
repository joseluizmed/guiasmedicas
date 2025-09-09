
import React from 'react';
import { healthPlans } from '../utils/constants';

interface PlanSelectorProps {
  selectedPlan: string;
  onPlanChange: (plan: string) => void;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ selectedPlan, onPlanChange }) => {
  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <label htmlFor="plan-select" className="block text-lg font-medium text-gray-700 mb-2">
        Selecione o Plano de Saúde
      </label>
      <select
        id="plan-select"
        value={selectedPlan}
        onChange={(e) => onPlanChange(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-secondary focus:border-secondary"
      >
        <option value="">-- Escolha um plano --</option>
        {healthPlans.map((plan) => (
          <option key={plan.value} value={plan.value}>
            {plan.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PlanSelector;
