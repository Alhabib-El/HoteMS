import { LiquorCategory } from "../api";

const categoryColor: Record<LiquorCategory, string> = {
  BEER: "#d97706",
  WINE: "#7c2d92",
  SPIRITS: "#78350f",
  LIQUEUR: "#be185d",
  READY_TO_DRINK: "#0891b2",
  NON_ALCOHOLIC: "#0ea5e9",
};

export function BottleIcon({ category, className }: { category: LiquorCategory; className?: string }) {
  const color = categoryColor[category];
  return (
    <svg viewBox="0 0 48 96" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="2" width="8" height="14" rx="1.5" fill={color} />
      <path d="M18 16h12l2 10c3 4 4 8 4 14v46a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V40c0-6 1-10 4-14z" fill={color} fillOpacity="0.85" />
      <rect x="10" y="52" width="28" height="20" rx="2" fill="white" fillOpacity="0.9" />
    </svg>
  );
}
