// The three ready-made examples (precomputed into data/examples/*.json).
export interface ExampleConfig {
  id: string;
  label: string;
  pitch: string;
  titles: string[];
}

export const EXAMPLES: ExampleConfig[] = [
  {
    id: "cozy-farm",
    label: "Cozy farming game",
    pitch: "A cozy farming game where you restore a seaside village, season by season (like Stardew Valley).",
    titles: ["Stardew Valley", "Animal Crossing: New Horizons"],
  },
  {
    id: "action-western",
    label: "Action western",
    pitch: "An open-world action western about an outlaw gang on the run (like Red Dead Redemption 2).",
    titles: ["Red Dead Redemption 2", "Red Dead Redemption"],
  },
  {
    id: "metroidvania",
    label: "Metroidvania",
    pitch: "A hand-drawn metroidvania with tough bosses and a hidden underground kingdom (like Hollow Knight).",
    titles: ["Hollow Knight", "Ori and the Will of the Wisps", "Dead Cells"],
  },
];
