import React from "react";

function QuickActionCard({ icon, title, description, onClick, color = "blue" }) {
  const colorClasses = {
    blue: "hover:from-blue-50 hover:to-purple-50 border-blue-200",
    green: "hover:from-green-50 hover:to-emerald-50 border-green-200",
    purple: "hover:from-purple-50 hover:to-pink-50 border-purple-200"
  };

  return (
    <div 
      className={`bg-white rounded-2xl p-6 border border-gray-200 ${colorClasses[color]} hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 group`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-white transition-colors">
          <span className="text-2xl">{icon}</span>
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 mb-1">{title}</h4>
          <p className="text-gray-600 text-sm">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default QuickActionCard;