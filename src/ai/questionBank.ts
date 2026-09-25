export type Difficulty = 'Remember' | 'Understand' | 'Apply' | 'Analyze';

export interface BankQuestion {
  id: string;
  courseId: string;
  moduleId: string;
  moduleTitle: string;
  co: string;
  bloom: string;
  paper: 'A' | 'B';
  difficulty: Difficulty;
  text: string;
  options: string[];
  answer: number;
  explanation: string;
}

export const QUESTIONS: BankQuestion[] = [
  /* ── Mathematics-I ─────────────────────────────────────────────── */
  {
    id: 'q-ma-1', courseId: 'mathematics-1', moduleId: 'm1', moduleTitle: 'Calculus of a Single Variable', co: 'CO1', bloom: 'Understand', paper: 'A', difficulty: 'Understand',
    text: 'The function f(x) = |x| is at x = 0.',
    options: ['Continuous but not differentiable', 'Differentiable but not continuous', 'Both continuous and differentiable', 'Neither continuous nor differentiable'],
    answer: 0,
    explanation: '|x| approaches 0 from both sides (continuous), but the left and right derivatives are −1 and +1 — so it is not differentiable at the origin.',
  },
  {
    id: 'q-ma-2', courseId: 'mathematics-1', moduleId: 'm1', moduleTitle: 'Calculus of a Single Variable', co: 'CO1', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'Evaluate: lim(x→0) sin(3x) / x',
    options: ['0', '1', '3', '1/3'],
    answer: 2,
    explanation: 'Using lim(θ→0) sinθ/θ = 1: sin(3x)/x = 3 · sin(3x)/(3x) → 3 · 1 = 3.',
  },
  {
    id: 'q-ma-3', courseId: 'mathematics-1', moduleId: 'm1', moduleTitle: 'Calculus of a Single Variable', co: 'CO1', bloom: 'Remember', paper: 'B', difficulty: 'Remember',
    text: "If f is continuous on [a, b] and differentiable on (a, b) with f(a) = f(b), then by Rolle's theorem there exists c ∈ (a, b) such that:",
    options: ["f(c) = 0", "f'(c) = 0", "f''(c) = 0", "f(c) = f(a)"],
    answer: 1,
    explanation: "Rolle's theorem guarantees a stationary point: f′(c) = 0 for some c in the open interval.",
  },
  {
    id: 'q-ma-4', courseId: 'mathematics-1', moduleId: 'm2', moduleTitle: 'Calculus of Several Variables', co: 'CO2', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'If f(x, y) = x²y + y³, then ∂²f/∂x∂y equals:',
    options: ['2x', '2y', 'x²', '3y²'],
    answer: 0,
    explanation: '∂f/∂y = x² + 3y², then ∂/∂x of that gives 2x.',
  },
  {
    id: 'q-ma-5', courseId: 'mathematics-1', moduleId: 'm2', moduleTitle: 'Calculus of Several Variables', co: 'CO2', bloom: 'Understand', paper: 'B', difficulty: 'Understand',
    text: 'Lagrange multipliers are used to find:',
    options: ['Limits of sequences', 'Extrema subject to constraints', 'Radius of convergence', 'Eigenvalues of a matrix'],
    answer: 1,
    explanation: 'The method of Lagrange multipliers locates stationary points of a function under a constraint ∇f = λ∇g.',
  },
  {
    id: 'q-ma-6', courseId: 'mathematics-1', moduleId: 'm3', moduleTitle: 'Multiple Integrals', co: 'CO3', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'The area of the region bounded by y = x² and y = 4 is:',
    options: ['16/3', '8/3', '4', '16'],
    answer: 0,
    explanation: 'Intersections at x = ±2: ∫₋₂² (4 − x²) dx = [4x − x³/3] = 16/3.',
  },
  {
    id: 'q-ma-7', courseId: 'mathematics-1', moduleId: 'm3', moduleTitle: 'Multiple Integrals', co: 'CO3', bloom: 'Understand', paper: 'B', difficulty: 'Understand',
    text: 'Changing the order of integration is justified by:',
    options: ["Green's theorem", "Fubini's theorem", "Stokes' theorem", "Cauchy's theorem"],
    answer: 1,
    explanation: "Fubini's theorem permits iterated integration in either order for continuous integrands over rectangular regions.",
  },
  {
    id: 'q-ma-8', courseId: 'mathematics-1', moduleId: 'm4', moduleTitle: 'Matrices & Linear Algebra', co: 'CO4', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'The rank of the matrix [[1,2,3],[2,4,6],[1,1,1]] is:',
    options: ['3', '2', '1', '0'],
    answer: 1,
    explanation: 'Row 2 = 2×Row 1, so only two independent rows remain → rank 2.',
  },
  {
    id: 'q-ma-9', courseId: 'mathematics-1', moduleId: 'm4', moduleTitle: 'Matrices & Linear Algebra', co: 'CO4', bloom: 'Analyze', paper: 'B', difficulty: 'Analyze',
    text: 'If λ is an eigenvalue of A, then an eigenvalue of A² is:',
    options: ['1/λ', 'λ²', '2λ', '√λ'],
    answer: 1,
    explanation: 'Av = λv ⟹ A²v = λAv = λ²v, so eigenvalues of A² are squares of those of A.',
  },

  /* ── BEEE ─────────────────────────────────────────────────────── */
  {
    id: 'q-ee-1', courseId: 'beee', moduleId: 'm1', moduleTitle: 'DC Circuit Fundamentals', co: 'CO1', bloom: 'Remember', paper: 'A', difficulty: 'Remember',
    text: "Ohm's law in point form is written as:",
    options: ['J = σE', 'J = ρE', 'E = ρJ', 'J = E/ρ'],
    answer: 0,
    explanation: 'Point form of Ohm\'s law is J = σE (current density = conductivity × field).',
  },
  {
    id: 'q-ee-2', courseId: 'beee', moduleId: 'm1', moduleTitle: 'DC Circuit Fundamentals', co: 'CO1', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'Two resistors of 6 Ω and 3 Ω in parallel carry a total current of 9 A. The current through the 3 Ω resistor is:',
    options: ['3 A', '6 A', '4.5 A', '9 A'],
    answer: 1,
    explanation: 'Current divides inversely: I₃ = 9 × 6/(6+3) = 6 A.',
  },
  {
    id: 'q-ee-3', courseId: 'beee', moduleId: 'm2', moduleTitle: 'Network Theorems', co: 'CO1', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: "In a network, KCL states that the algebraic sum of currents at a node is:",
    options: ['Equal to voltage', 'Zero', 'Equal to power', 'Equal to resistance'],
    answer: 1,
    explanation: 'KCL — charge conservation: Σi = 0 at every node.',
  },
  {
    id: 'q-ee-4', courseId: 'beee', moduleId: 'm2', moduleTitle: 'Network Theorems', co: 'CO1', bloom: 'Analyze', paper: 'B', difficulty: 'Analyze',
    text: 'A network with a 12 V source and series resistance 4 Ω has maximum power delivered to a load of:',
    options: ['2 Ω', '4 Ω', '8 Ω', '12 Ω'],
    answer: 1,
    explanation: 'Maximum power transfer theorem: R_L = R_th = 4 Ω.',
  },
  {
    id: 'q-ee-5', courseId: 'beee', moduleId: 'm2', moduleTitle: 'Network Theorems', co: 'CO1', bloom: 'Understand', paper: 'A', difficulty: 'Understand',
    text: "Thevenin's equivalent consists of:",
    options: ['V_th in series with R_th', 'I_n in parallel with R_th', 'V_th in parallel with R_th', 'A current source only'],
    answer: 0,
    explanation: 'Thevenin = one voltage source V_th in series with R_th; Norton is the dual (current source ∥ R).',
  },
  {
    id: 'q-ee-6', courseId: 'beee', moduleId: 'm3', moduleTitle: 'Diodes & Rectifiers', co: 'CO2', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'The ripple frequency of a full-wave rectifier with 50 Hz input is:',
    options: ['25 Hz', '50 Hz', '100 Hz', '200 Hz'],
    answer: 2,
    explanation: 'Full-wave rectification doubles the ripple frequency: 2 × 50 = 100 Hz.',
  },
  {
    id: 'q-ee-7', courseId: 'beee', moduleId: 'm3', moduleTitle: 'Diodes & Rectifiers', co: 'CO2', bloom: 'Understand', paper: 'B', difficulty: 'Understand',
    text: 'A Zener diode in reverse bias is used mainly as:',
    options: ['Rectifier', 'Voltage regulator', 'Amplifier', 'Oscillator'],
    answer: 1,
    explanation: 'Above breakdown, the Zener holds a nearly constant voltage — the basis of shunt regulation.',
  },
  {
    id: 'q-ee-8', courseId: 'beee', moduleId: 'm4', moduleTitle: 'Transistors (BJT) & Biasing', co: 'CO3', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'For a BJT in CE configuration, α = 0.98 implies β ≈:',
    options: ['25', '49', '98', '100'],
    answer: 1,
    explanation: 'β = α/(1−α) = 0.98/0.02 = 49.',
  },
  {
    id: 'q-ee-9', courseId: 'beee', moduleId: 'm4', moduleTitle: 'Transistors (BJT) & Biasing', co: 'CO3', bloom: 'Analyze', paper: 'B', difficulty: 'Analyze',
    text: 'Fixed-bias stability improves when:',
    options: ['R_B decreases', 'β increases', 'R_C increases', 'V_CC decreases'],
    answer: 0,
    explanation: 'A smaller base resistor raises base current relative to β variations, but stability fundamentally needs emitter feedback — among the options, decreasing R_B reduces β-sensitivity of operating point.',
  },
  {
    id: 'q-ee-10', courseId: 'beee', moduleId: 'm5', moduleTitle: 'MOSFET & Applications', co: 'CO3', bloom: 'Understand', paper: 'A', difficulty: 'Understand',
    text: 'An enhancement-mode MOSFET conducts when:',
    options: ['V_GS = 0', 'V_GS exceeds V_th', 'V_GS is negative only', 'Drain is open'],
    answer: 1,
    explanation: 'No channel exists at V_GS = 0; a channel forms once V_GS > V_th.',
  },
  {
    id: 'q-ee-11', courseId: 'beee', moduleId: 'm5', moduleTitle: 'MOSFET & Applications', co: 'CO3', bloom: 'Apply', paper: 'B', difficulty: 'Apply',
    text: 'In digital switching, a MOSFET driven hard into inversion operates as a:',
    options: ['Linear amplifier', 'Voltage-controlled switch', 'Current source', 'Diode'],
    answer: 1,
    explanation: 'Ohmic-region operation with low R_DS(on) makes it a near-ideal switch — the heart of CMOS logic.',
  },
  {
    id: 'q-ee-12', courseId: 'beee', moduleId: 'm6', moduleTitle: 'Operational Amplifiers', co: 'CO4', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'An inverting amplifier has R_f = 100 kΩ, R_in = 10 kΩ. The closed-loop gain is:',
    options: ['+10', '−10', '−100', '+100'],
    answer: 1,
    explanation: 'A_v = −R_f/R_in = −100/10 = −10.',
  },
  {
    id: 'q-ee-13', courseId: 'beee', moduleId: 'm6', moduleTitle: 'Operational Amplifiers', co: 'CO4', bloom: 'Analyze', paper: 'B', difficulty: 'Analyze',
    text: 'For an ideal op-amp, the two input terminals behave as if:',
    options: ['A finite current flows between them', 'Zero current flows and they are at the same potential', 'They are shorted to ground', 'Voltage between them is always 1 V'],
    answer: 1,
    explanation: 'Infinite input impedance ⟹ i₊ = i₋ = 0; negative feedback ⟹ virtual short: v₊ = v₋.',
  },
  {
    id: 'q-ee-14', courseId: 'beee', moduleId: 'm6', moduleTitle: 'Operational Amplifiers', co: 'CO4', bloom: 'Understand', paper: 'A', difficulty: 'Understand',
    text: 'A comparator with positive feedback is also called:',
    options: ['Summing amplifier', 'Schmitt trigger', 'Integrator', 'Voltage follower'],
    answer: 1,
    explanation: 'Hysteresis from positive feedback gives clean switching — a Schmitt trigger.',
  },

  /* ── Physics ──────────────────────────────────────────────────── */
  {
    id: 'q-ph-1', courseId: 'physics', moduleId: 'm1', moduleTitle: 'Oscillations & Waves', co: 'CO1', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'A particle executes SHM with amplitude 4 cm and frequency 50 Hz. Its maximum speed (cm/s) is:',
    options: ['200π', '100π', '400π', '50π'],
    answer: 2,
    explanation: 'v_max = Aω = 4 × 2π(50) = 400π cm/s.',
  },
  {
    id: 'q-ph-2', courseId: 'physics', moduleId: 'm1', moduleTitle: 'Oscillations & Waves', co: 'CO1', bloom: 'Understand', paper: 'B', difficulty: 'Understand',
    text: 'In a damped oscillator, the amplitude decays as:',
    options: ['e^(+γt)', 'e^(−γt)', 't²', 'constant'],
    answer: 1,
    explanation: 'Dissipation gives A(t) = A₀e^(−γt) with γ = b/2m.',
  },
  {
    id: 'q-ph-3', courseId: 'physics', moduleId: 'm2', moduleTitle: 'Electromagnetic Theory', co: 'CO2', bloom: 'Remember', paper: 'A', difficulty: 'Remember',
    text: "Gauss's law for electrostatics relates electric flux to:",
    options: ['Magnetic pole charge', 'Enclosed free charge', 'Surface current', 'Energy density'],
    answer: 1,
    explanation: '∮E·dA = Q_enc/ε₀ — flux depends only on enclosed charge.',
  },
  {
    id: 'q-ph-4', courseId: 'physics', moduleId: 'm2', moduleTitle: 'Electromagnetic Theory', co: 'CO2', bloom: 'Analyze', paper: 'B', difficulty: 'Analyze',
    text: 'A parallel-plate capacitor with dielectric inserted (K > 1) keeps its charge constant. The stored energy:',
    options: ['Increases by factor K', 'Decreases by factor K', 'Stays the same', 'Becomes zero'],
    answer: 1,
    explanation: 'U = Q²/2C and C → KC, so U → U/K — the battery is disconnected, charge fixed.',
  },
  {
    id: 'q-ph-5', courseId: 'physics', moduleId: 'm3', moduleTitle: 'Optics', co: 'CO3', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'In Young\'s double slit, fringe spacing doubles when:',
    options: ['Slit separation is halved', 'Screen distance is halved', 'Wavelength is halved', 'Slits are widened'],
    answer: 0,
    explanation: 'β = λD/d — halving d doubles β.',
  },
  {
    id: 'q-ph-6', courseId: 'physics', moduleId: 'm3', moduleTitle: 'Optics', co: 'CO3', bloom: 'Understand', paper: 'B', difficulty: 'Understand',
    text: 'A laser differs from an ordinary bulb mainly because it is:',
    options: ['Brighter', 'Monochromatic, coherent and directional', 'Cheaper', 'White'],
    answer: 1,
    explanation: 'Stimulated emission yields single wavelength, fixed phase relation and low divergence.',
  },
  {
    id: 'q-ph-7', courseId: 'physics', moduleId: 'm4', moduleTitle: 'Quantum & Semiconductor Physics', co: 'CO4', bloom: 'Understand', paper: 'A', difficulty: 'Understand',
    text: 'The de Broglie wavelength of a particle is given by:',
    options: ['h/p', 'h·p', 'p/h', 'E/v'],
    answer: 0,
    explanation: 'λ = h/p — matter waves scale inversely with momentum.',
  },
  {
    id: 'q-ph-8', courseId: 'physics', moduleId: 'm4', moduleTitle: 'Quantum & Semiconductor Physics', co: 'CO4', bloom: 'Analyze', paper: 'B', difficulty: 'Analyze',
    text: 'In an intrinsic semiconductor at higher temperature, the number of free electrons:',
    options: ['Decreases', 'Increases', 'Stays constant', 'Becomes zero'],
    answer: 1,
    explanation: 'Thermal generation promotes more electrons across the gap; n = p rises exponentially with T.',
  },

  /* ── English ──────────────────────────────────────────────────── */
  {
    id: 'q-en-1', courseId: 'english', moduleId: 'm1', moduleTitle: 'Technical Communication Fundamentals', co: 'CO1', bloom: 'Remember', paper: 'A', difficulty: 'Remember',
    text: 'Technical communication prioritises:',
    options: ['Flowery language', 'Clarity and precision', 'Personal opinion', 'Ambiguity'],
    answer: 1,
    explanation: 'Engineer-to-engineer writing values unambiguous, task-oriented language above all.',
  },
  {
    id: 'q-en-2', courseId: 'english', moduleId: 'm1', moduleTitle: 'Technical Communication Fundamentals', co: 'CO1', bloom: 'Understand', paper: 'B', difficulty: 'Understand',
    text: 'The appropriate register for a project status email to a client is:',
    options: ['Casual slang', 'Formal–neutral', 'Poetic', 'Conversational'],
    answer: 1,
    explanation: 'External professional contexts call for formal–neutral register with clear structure.',
  },
  {
    id: 'q-en-3', courseId: 'english', moduleId: 'm2', moduleTitle: 'Speaking & Presentation Skills', co: 'CO2', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'The "you-attitude" in a presentation means:',
    options: ['Talking about yourself', 'Framing content around the audience\'s needs', 'Reading slides aloud', 'Avoiding eye contact'],
    answer: 1,
    explanation: 'You-attitude centres the listener: benefits, expectations and vocabulary they recognise.',
  },
  {
    id: 'q-en-4', courseId: 'english', moduleId: 'm3', moduleTitle: 'Technical Writing & Documentation', co: 'CO3', bloom: 'Analyze', paper: 'B', difficulty: 'Analyze',
    text: 'The best structure for a feasibility report is:',
    options: ['Chronological', 'Problem → criteria → options → recommendation', 'Alphabetical', 'Random'],
    answer: 1,
    explanation: 'Decision-oriented reports move from problem through evaluated options to a justified recommendation.',
  },
  {
    id: 'q-en-5', courseId: 'english', moduleId: 'm4', moduleTitle: 'Workplace Communication & Ethics', co: 'CO4', bloom: 'Remember', paper: 'A', difficulty: 'Remember',
    text: 'Attributing another\'s idea to yourself is called:',
    options: ['Paraphrasing', 'Plagiarism', 'Summarising', 'Citing'],
    answer: 1,
    explanation: 'Presenting others\' work as your own is plagiarism — an academic and professional offence.',
  },
  {
    id: 'q-en-6', courseId: 'english', moduleId: 'm4', moduleTitle: 'Workplace Communication & Ethics', co: 'CO4', bloom: 'Understand', paper: 'B', difficulty: 'Understand',
    text: 'A behavioural interview question asks about:',
    options: ['Your marks', 'A real situation and what you did', 'Hypothetical physics', 'Salary expectations'],
    answer: 1,
    explanation: 'STAR-format answers (Situation–Task–Action–Result) to past experiences are what such questions seek.',
  },

  /* ── Engineering Graphics ─────────────────────────────────────── */
  {
    id: 'q-gr-1', courseId: 'graphics', moduleId: 'm1', moduleTitle: 'Engineering Drawing Fundamentals', co: 'CO1', bloom: 'Remember', paper: 'A', difficulty: 'Remember',
    text: 'A visible outline on an engineering drawing is drawn with:',
    options: ['Thin dashed line', 'Thick continuous line', 'Chain line', 'Wavy line'],
    answer: 1,
    explanation: 'Visible edges use thick continuous (object) lines.',
  },
  {
    id: 'q-gr-2', courseId: 'graphics', moduleId: 'm1', moduleTitle: 'Engineering Drawing Fundamentals', co: 'CO1', bloom: 'Understand', paper: 'B', difficulty: 'Understand',
    text: 'A centre line indicates:',
    options: ['An edge', 'An axis of symmetry', 'A hidden surface', 'A cutting plane'],
    answer: 1,
    explanation: 'Chain lines (long–short–long) mark axes of symmetry and centres.',
  },
  {
    id: 'q-gr-3', courseId: 'graphics', moduleId: 'm2', moduleTitle: 'Orthographic Projections', co: 'CO2', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'In first-angle projection, the object is placed:',
    options: ['Between observer and plane', 'Beyond the plane', 'On the plane only', 'Below the ground'],
    answer: 0,
    explanation: 'First angle: object between observer and projection plane (European/Indian default).',
  },
  {
    id: 'q-gr-4', courseId: 'graphics', moduleId: 'm2', moduleTitle: 'Orthographic Projections', co: 'CO2', bloom: 'Analyze', paper: 'B', difficulty: 'Analyze',
    text: 'A line inclined to both HP and VP projects as a true length in:',
    options: ['Top view', 'Front view', 'Auxiliary view parallel to it', 'Profile view always'],
    answer: 2,
    explanation: 'True length appears only when the line is parallel to the projection plane — hence auxiliary planes.',
  },
  {
    id: 'q-gr-5', courseId: 'graphics', moduleId: 'm3', moduleTitle: 'Sections & Development of Surfaces', co: 'CO3', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'Sectional views reveal:',
    options: ['Only outer shape', 'Internal features', 'Colour', 'Material cost'],
    answer: 1,
    explanation: 'Cutting a solid exposes hidden internal geometry, hatched at 45°.',
  },
  {
    id: 'q-gr-6', courseId: 'graphics', moduleId: 'm4', moduleTitle: 'Isometric & Perspective Views', co: 'CO4', bloom: 'Apply', paper: 'B', difficulty: 'Apply',
    text: 'Isometric axes are separated by:',
    options: ['30°', '45°', '60°', '90°'],
    answer: 0,
    explanation: 'Two axes at 30° to the horizontal (60° between them) — equal measure in all three directions.',
  },
];

export const QUESTIONS_BY_MODULE: Record<string, BankQuestion[]> = QUESTIONS.reduce((acc, q) => {
  const key = `${q.courseId}:${q.moduleId}`;
  (acc[key] ||= []).push(q);
  return acc;
}, {} as Record<string, BankQuestion[]>);

export function questionsFor(courseId: string, moduleId: string): BankQuestion[] {
  return QUESTIONS_BY_MODULE[`${courseId}:${moduleId}`] ?? [];
}

export function subjectsWithQuestions(): { courseId: string; modules: { moduleId: string; title: string; count: number }[] }[] {
  const map = new Map<string, Map<string, { title: string; count: number }>>();
  for (const q of QUESTIONS) {
    if (!map.has(q.courseId)) map.set(q.courseId, new Map());
    const mods = map.get(q.courseId)!;
    const cur = mods.get(q.moduleId);
    mods.set(q.moduleId, { title: q.moduleTitle, count: (cur?.count ?? 0) + 1 });
  }
  return [...map.entries()].map(([courseId, mods]) => ({
    courseId,
    modules: [...mods.entries()].map(([moduleId, v]) => ({ moduleId, title: v.title, count: v.count })),
  }));
}
