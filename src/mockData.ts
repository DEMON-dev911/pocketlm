import { Notebook } from "./types";

export const INITIAL_NOTEBOOKS: Notebook[] = [
  {
    id: "nb-bio101",
    name: "Biology 101: Cellular Respiration",
    description: "Lecture notes and textbook readings on glycolysis, Krebs cycle, and electron transport chain.",
    createdAt: "July 10, 2026",
    tags: ["Biology", "Science"],
    sources: [
      {
        id: "src-bio-1",
        name: "Glycolysis_Ch4_Reading.pdf",
        type: "pdf",
        content: `Glycolysis is the metabolic pathway that converts glucose into pyruvate. The free energy released in this process is used to form high-energy molecules ATP and NADH. Glycolysis is a sequence of ten enzyme-catalyzed reactions. It occurs in the cytosol of cells and does not require oxygen (anaerobic).

The process can be divided into two main phases:
1. The preparatory phase (energy investment phase), where ATP is consumed to phosphorylate glucose. Glucose (6 carbons) is split into two molecules of glyceraldehyde-3-phosphate (G3P) (3 carbons).
2. The pay-off phase (energy harvest phase), where ATP and NADH are produced. For every molecule of glucose, glycolysis yields a net of 2 ATP, 2 NADH, and 2 pyruvate molecules.

Key regulatory enzymes in glycolysis include Hexokinase, Phosphofructokinase (PFK), and Pyruvate Kinase. PFK is the rate-limiting step of glycolysis and is allosterically regulated by ATP and AMP levels. High ATP inhibits PFK, while high AMP activates it.`,
        active: true,
        wordCount: 168
      },
      {
        id: "src-bio-2",
        name: "Krebs_Cycle_Lecture_Notes.txt",
        type: "text",
        content: `Krebs Cycle (also known as the Citric Acid Cycle or TCA cycle) occurs in the mitochondrial matrix of eukaryotic cells. It is a closed loop of eight reactions where acetyl-CoA is oxidized to form carbon dioxide, ATP/GTP, NADH, and FADH2.

Key Steps:
1. Acetyl-CoA (2 carbons) combines with oxaloacetate (4 carbons) to form Citrate (6 carbons), catalyzed by Citrate Synthase.
2. Isocitrate is oxidized to alpha-ketoglutarate, producing NADH and releasing CO2.
3. Alpha-ketoglutarate is oxidized to succinyl-CoA, producing NADH and releasing CO2.
4. Succinyl-CoA is converted to succinate, generating one GTP (which converts to ATP).
5. Succinate is oxidized to fumarate, reducing FAD to FADH2.
6. Malate is oxidized back to oxaloacetate, producing the final NADH.

For each turn of the Krebs cycle, the inputs are 1 Acetyl-CoA, 3 NAD+, 1 FAD, 1 ADP. The outputs are 2 CO2, 3 NADH, 1 FADH2, 1 ATP. Since one glucose molecule yields two pyruvales, the cycle turns twice per glucose, producing 6 NADH, 2 FADH2, and 2 ATP.`,
        active: true,
        wordCount: 184
      },
      {
        id: "src-bio-3",
        name: "Syllabus_Exam_Prep_Guide.docx",
        type: "doc",
        content: `Biology 101 Midterm Exam prep requirements:
Students must master the inputs, outputs, and cellular locations of glycolysis, Krebs Cycle, and the Electron Transport Chain (ETC).
- Glycolysis: Cytosol. Inputs: Glucose, 2 ATP, 2 NAD+. Outputs: 2 Pyruvate, 4 ATP (2 Net), 2 NADH.
- Krebs Cycle: Mitochondrial matrix. Inputs: 2 Acetyl-CoA, 6 NAD+, 2 FAD, 2 ADP. Outputs: 4 CO2, 6 NADH, 2 FADH2, 2 ATP.
- Electron Transport Chain / Oxidative Phosphorylation: Inner mitochondrial membrane (cristae). Inputs: 10 NADH, 2 FADH2, Oxygen. Outputs: ~28-32 ATP, Water.

Pro-tip: Focus heavily on the regulation of enzymes like PFK (inhibited by ATP, activated by AMP) and Citrate Synthase. Understand the role of oxygen as the final electron acceptor in ETC. If oxygen is absent, cells undergo fermentation.`,
        active: false,
        wordCount: 139
      }
    ],
    chatHistory: [
      {
        id: "msg-1",
        role: "user",
        content: "What is the net ATP yield of glycolysis, and where does it occur?",
        timestamp: "09:30 AM"
      },
      {
        id: "msg-2",
        role: "assistant",
        content: "Glycolysis occurs in the **cytosol** of the cell. It yields a **net of 2 ATP** molecules per glucose molecule (4 ATP are produced in the pay-off phase, but 2 ATP are consumed in the preparatory investment phase) [1].",
        timestamp: "09:31 AM",
        citations: [
          {
            id: "cit-bio-1",
            sourceId: "src-bio-1",
            sourceName: "Glycolysis_Ch4_Reading.pdf",
            snippet: "It occurs in the cytosol of cells... glycolysis yields a net of 2 ATP, 2 NADH, and 2 pyruvate molecules."
          }
        ]
      }
    ],
    flashcards: [
      {
        id: "fc-bio-1",
        question: "Where in the cell does glycolysis take place?",
        answer: "In the cytosol of the cell."
      },
      {
        id: "fc-bio-2",
        question: "What enzyme acts as the rate-limiting step of glycolysis?",
        answer: "Phosphofructokinase (PFK), which is allosterically regulated by ATP and AMP."
      },
      {
        id: "fc-bio-3",
        question: "What are the net outputs of one glucose molecule entering glycolysis?",
        answer: "2 Pyruvate molecules, 2 NADH, and a net of 2 ATP."
      }
    ],
    podcastTurns: [
      { id: "p-bio-1", speaker: "Aidan", text: "Welcome to today's study session. We are breaking down the cell's energetic core: cellular respiration." },
      { id: "p-bio-2", speaker: "Maya", text: "Oh, I love this topic! It's like looking at the power plants inside our very cells. And it all starts with glycolysis!" },
      { id: "p-bio-3", speaker: "Aidan", text: "True, glycolysis literally translates to 'sugar splitting'. It's a ancient anaerobic pathway in the cytosol." },
      { id: "p-bio-4", speaker: "Maya", text: "Right, no oxygen needed. It inputs a glucose molecule, spends 2 ATP as investment, and yields a net of 2 ATP and 2 NADH. It's like spending a little money to make a small profit." },
      { id: "p-bio-5", speaker: "Aidan", text: "And then those products are shuttled into the mitochondria for the Krebs Cycle, which is a closed loop of oxidations." },
      { id: "p-bio-6", speaker: "Maya", text: "And that's where the real NADH jackpot is, setting us up for the big ATP payoff in the electron transport chain!" }
    ]
  },
  {
    id: "nb-calc2",
    name: "Calculus II: Integration Techniques",
    description: "Formulas and practice questions for Integration by Parts, Trigonometric Substitution, and Partial Fractions.",
    createdAt: "July 08, 2026",
    tags: ["Math", "Calculus"],
    sources: [
      {
        id: "src-calc-1",
        name: "Integration_by_Parts_Formula.pdf",
        type: "pdf",
        content: `Integration by parts is a technique that simplifies integrals of the form \u222b u dv. It is based on the product rule for differentiation.

The Integration by Parts formula is:
\u222bu dv = uv - \u222bv du

To choose which part of the integrand is 'u' and which is 'dv', the LIATE rule is commonly used as a guideline:
L - Logarithmic functions (e.g., ln x)
I - Inverse trigonometric functions (e.g., arctan x)
A - Algebraic functions (e.g., x^2, 3x)
T - Trigonometric functions (e.g., sin x)
E - Exponential functions (e.g., e^x)

Whichever function type appears first in the LIATE list should be chosen as 'u', and the remaining part should be chosen as 'dv'.

Example: For \u222bx ln(x) dx:
- Logarithmic (ln x) is 'L', Algebraic (x) is 'A'.
- So let u = ln(x), dv = x dx.
- Then du = (1/x) dx, v = (1/2)x^2.
- Applying the formula: (1/2)x^2 ln(x) - \u222b (1/2)x^2 (1/x) dx = (1/2)x^2 ln(x) - (1/4)x^2 + C.`,
        active: true,
        wordCount: 165
      }
    ],
    chatHistory: [],
    flashcards: [
      {
        id: "fc-calc-1",
        question: "What is the formula for Integration by Parts?",
        answer: "\u222bu dv = uv - \u222bv du"
      },
      {
        id: "fc-calc-2",
        question: "What does the LIATE rule stand for, and how is it used?",
        answer: "LIATE stands for Logarithmic, Inverse trigonometric, Algebraic, Trigonometric, Exponential. It helps decide which part of an integrand to assign as 'u' (first matched in the list) during Integration by Parts."
      }
    ]
  }
];
