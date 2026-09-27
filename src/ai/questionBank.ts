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

  /* ── Mathematics-I (continued) ──────────────────────────────────── */
  {
    id: 'q-ma-10', courseId: 'mathematics-1', moduleId: 'm1', moduleTitle: 'Calculus of a Single Variable', co: 'CO1', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'If f(x) = x·ln x (x > 0), then f′(x) equals:',
    options: ['ln x', 'ln x + 1', '1/x', 'x + ln x'],
    answer: 1,
    explanation: 'Product rule: (x)′·ln x + x·(ln x)′ = ln x + x·(1/x) = ln x + 1.',
  },
  {
    id: 'q-ma-11', courseId: 'mathematics-1', moduleId: 'm1', moduleTitle: 'Calculus of a Single Variable', co: 'CO1', bloom: 'Remember', paper: 'B', difficulty: 'Remember',
    text: 'The antiderivative of 1/x is:',
    options: ['1/x² + C', 'ln|x| + C', 'x + C', 'eˣ + C'],
    answer: 1,
    explanation: 'd/dx ln|x| = 1/x for all x ≠ 0, so ∫(1/x) dx = ln|x| + C.',
  },
  {
    id: 'q-ma-12', courseId: 'mathematics-1', moduleId: 'm1', moduleTitle: 'Calculus of a Single Variable', co: 'CO1', bloom: 'Analyze', paper: 'A', difficulty: 'Analyze',
    text: 'The function f(x) = x³ − 3x attains a local maximum at x =',
    options: ['−1', '0', '1', '3'],
    answer: 0,
    explanation: 'f′ = 3x² − 3 = 0 at x = ±1; f″ = 6x is negative at x = −1 → local maximum there.',
  },
  {
    id: 'q-ma-13', courseId: 'mathematics-1', moduleId: 'm2', moduleTitle: 'Calculus of Several Variables', co: 'CO2', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'If f(x, y) = x² + y², then ∂f/∂x evaluated at (3, 4) is:',
    options: ['3', '4', '6', '7'],
    answer: 2,
    explanation: '∂f/∂x = 2x; at x = 3 it equals 6.',
  },
  {
    id: 'q-ma-14', courseId: 'mathematics-1', moduleId: 'm2', moduleTitle: 'Calculus of Several Variables', co: 'CO2', bloom: 'Remember', paper: 'B', difficulty: 'Remember',
    text: 'The directional derivative of f along a unit vector u is:',
    options: ['∇f + u', '∇f · u', '∇f / u', 'u · x'],
    answer: 1,
    explanation: 'D_u f = ∇f · u — the projection of the gradient onto the direction of travel.',
  },
  {
    id: 'q-ma-15', courseId: 'mathematics-1', moduleId: 'm2', moduleTitle: 'Calculus of Several Variables', co: 'CO2', bloom: 'Apply', paper: 'B', difficulty: 'Apply',
    text: 'The gradient of f(x, y) = x²y is:',
    options: ['(2xy, x²)', '(x², 2xy)', '(2x, y)', '(xy, x²)'],
    answer: 0,
    explanation: '∂f/∂x = 2xy and ∂f/∂y = x², so ∇f = (2xy, x²).',
  },
  {
    id: 'q-ma-16', courseId: 'mathematics-1', moduleId: 'm3', moduleTitle: 'Multiple Integrals', co: 'CO3', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'The value of ∫₀¹∫₀¹ xy dx dy is:',
    options: ['1/2', '1/4', '1', '0'],
    answer: 1,
    explanation: 'The integrand separates: (∫₀¹ x dx)(∫₀¹ y dy) = (1/2)(1/2) = 1/4.',
  },
  {
    id: 'q-ma-17', courseId: 'mathematics-1', moduleId: 'm3', moduleTitle: 'Multiple Integrals', co: 'CO3', bloom: 'Remember', paper: 'B', difficulty: 'Remember',
    text: 'In polar coordinates, the area element dA becomes:',
    options: ['dr dθ', 'r dr dθ', 'r² dr dθ', 'dx dy'],
    answer: 1,
    explanation: 'x = r cos θ, y = r sin θ gives the Jacobian r, so dA = r dr dθ.',
  },
  {
    id: 'q-ma-18', courseId: 'mathematics-1', moduleId: 'm3', moduleTitle: 'Multiple Integrals', co: 'CO3', bloom: 'Analyze', paper: 'A', difficulty: 'Analyze',
    text: 'The volume of the region z ≤ 1 over the unit disk x² + y² ≤ 1 is:',
    options: ['1', 'π', 'π/3', '4/3'],
    answer: 1,
    explanation: 'Volume = ∬ 1 dA = area of the unit disk = π.',
  },
  {
    id: 'q-ma-19', courseId: 'mathematics-1', moduleId: 'm4', moduleTitle: 'Matrices & Linear Algebra', co: 'CO4', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'The eigenvalues of the diagonal matrix [[2,0],[0,3]] are:',
    options: ['2 and 3', '5 and 6', '1 and 6', '0 and 5'],
    answer: 0,
    explanation: 'For a diagonal matrix the eigenvalues are exactly the diagonal entries.',
  },
  {
    id: 'q-ma-20', courseId: 'mathematics-1', moduleId: 'm4', moduleTitle: 'Matrices & Linear Algebra', co: 'CO4', bloom: 'Understand', paper: 'B', difficulty: 'Understand',
    text: 'A square matrix is singular if and only if its determinant is:',
    options: ['Zero', 'One', 'Positive', 'Equal to the trace'],
    answer: 0,
    explanation: 'det(A) = 0 ⇔ A is not invertible ⇔ the matrix is singular.',
  },

  /* ── Physics (continued) ───────────────────────────────────────── */
  {
    id: 'q-ph-9', courseId: 'physics', moduleId: 'm1', moduleTitle: 'Oscillations & Waves', co: 'CO1', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'If the length of a simple pendulum is doubled, its time period becomes:',
    options: ['T/√2', 'T·√2', '2T', 'Unchanged'],
    answer: 1,
    explanation: 'T = 2π√(L/g) ∝ √L, so doubling L multiplies T by √2.',
  },
  {
    id: 'q-ph-10', courseId: 'physics', moduleId: 'm1', moduleTitle: 'Oscillations & Waves', co: 'CO1', bloom: 'Remember', paper: 'B', difficulty: 'Remember',
    text: 'The SI unit of frequency of a wave is:',
    options: ['Hz', 'Becquerel', 'dB', 'N·s'],
    answer: 0,
    explanation: 'Hertz (Hz = s⁻¹) counts cycles per second; the becquerel counts nuclear decays, not wave cycles.',
  },
  {
    id: 'q-ph-11', courseId: 'physics', moduleId: 'm2', moduleTitle: 'Electromagnetic Theory', co: 'CO2', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'Two point charges of 1 μC each are 1 m apart. The Coulomb force (k = 9×10⁹ N·m²/C²) is:',
    options: ['9×10⁻³ N', '9 N', '4.5×10⁻³ N', 'Zero'],
    answer: 0,
    explanation: 'F = k q₁q₂/r² = 9×10⁹ × 10⁻¹² / 1 = 9×10⁻³ N (repulsive).',
  },
  {
    id: 'q-ph-12', courseId: 'physics', moduleId: 'm2', moduleTitle: 'Electromagnetic Theory', co: 'CO2', bloom: 'Understand', paper: 'B', difficulty: 'Understand',
    text: "Lenz's law is a direct consequence of:",
    options: ['Conservation of charge', 'Conservation of energy', "Ohm's law", "Gauss's law"],
    answer: 1,
    explanation: 'The induced current opposes the change producing it — otherwise energy would be created for free.',
  },
  {
    id: 'q-ph-13', courseId: 'physics', moduleId: 'm3', moduleTitle: 'Optics', co: 'CO3', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'A real object is placed at 2f in front of a thin convex lens. The image forms at:',
    options: ['f', '2f', 'f/2', 'Infinity'],
    answer: 1,
    explanation: '1/v − 1/u = 1/f with u = −2f gives v = 2f — real, inverted, same size.',
  },
  {
    id: 'q-ph-14', courseId: 'physics', moduleId: 'm3', moduleTitle: 'Optics', co: 'CO3', bloom: 'Understand', paper: 'B', difficulty: 'Understand',
    text: 'A path difference of exactly mλ (m = 1, 2, 3 …) between two coherent sources produces:',
    options: ['A bright fringe', 'A dark fringe', 'No fringe', 'Polarisation'],
    answer: 0,
    explanation: 'mλ means the waves arrive in phase → constructive interference → bright fringe.',
  },
  {
    id: 'q-ph-15', courseId: 'physics', moduleId: 'm4', moduleTitle: 'Quantum & Semiconductor Physics', co: 'CO4', bloom: 'Remember', paper: 'A', difficulty: 'Remember',
    text: 'The work function φ of a metal is related to its threshold wavelength λ₀ by:',
    options: ['φ = hc·λ₀', 'φ = hc/λ₀', 'φ = h/λ₀', 'φ = c/λ₀'],
    answer: 1,
    explanation: 'Photon energy at threshold exactly equals the work function: hc/λ₀ = φ.',
  },
  {
    id: 'q-ph-16', courseId: 'physics', moduleId: 'm4', moduleTitle: 'Quantum & Semiconductor Physics', co: 'CO4', bloom: 'Apply', paper: 'B', difficulty: 'Apply',
    text: 'Adding a pentavalent impurity (e.g. arsenic) to pure silicon creates:',
    options: ['A p-type semiconductor', 'An n-type semiconductor', 'An intrinsic semiconductor', 'An insulator'],
    answer: 1,
    explanation: 'The fifth bond donates a free electron — majority carriers are electrons (n-type).',
  },

  /* ── BEEE (continued) ──────────────────────────────────────────── */
  {
    id: 'q-ee-15', courseId: 'beee', moduleId: 'm1', moduleTitle: 'DC Circuit Fundamentals', co: 'CO1', bloom: 'Apply', paper: 'B', difficulty: 'Apply',
    text: 'A 12 V battery drives a current of 0.5 A through a resistor. The resistance is:',
    options: ['6 Ω', '24 Ω', '0.042 Ω', '2.4 Ω'],
    answer: 1,
    explanation: "Ohm's law: R = V/I = 12/0.5 = 24 Ω.",
  },
  {
    id: 'q-ee-16', courseId: 'beee', moduleId: 'm2', moduleTitle: 'Network Theorems', co: 'CO1', bloom: 'Understand', paper: 'A', difficulty: 'Understand',
    text: "The superposition theorem is applicable to:",
    options: ['Only AC networks', 'Linear bilateral networks', 'Only mesh networks', 'Nonlinear networks only'],
    answer: 1,
    explanation: 'Superposition relies on linearity — each independent source is considered alone in a linear network.',
  },
  {
    id: 'q-ee-17', courseId: 'beee', moduleId: 'm3', moduleTitle: 'Diodes & Rectifiers', co: 'CO2', bloom: 'Apply', paper: 'B', difficulty: 'Apply',
    text: 'A full-wave rectifier fed from a 50 Hz AC supply produces a ripple frequency of:',
    options: ['25 Hz', '50 Hz', '100 Hz', '200 Hz'],
    answer: 2,
    explanation: 'Both half-cycles are used, so the ripple is twice the supply frequency: 2 × 50 = 100 Hz.',
  },
  {
    id: 'q-ee-18', courseId: 'beee', moduleId: 'm4', moduleTitle: 'Transistors (BJT) & Biasing', co: 'CO3', bloom: 'Understand', paper: 'A', difficulty: 'Understand',
    text: 'For a BJT working in the active region, the junctions are biased as:',
    options: ['Both forward biased', 'Base–emitter forward, collector–base reverse', 'Base–emitter reverse, collector–base forward', 'Both reverse biased'],
    answer: 1,
    explanation: 'Active-region amplification needs BE forward (injection) and CB reverse (collection).',
  },
  {
    id: 'q-ee-19', courseId: 'beee', moduleId: 'm5', moduleTitle: 'MOSFET & Applications', co: 'CO3', bloom: 'Remember', paper: 'B', difficulty: 'Remember',
    text: 'The gate current of a MOSFET in steady state is approximately:',
    options: ['Large', 'Zero (insulated gate)', 'Equal to drain current', 'Equal to source current'],
    answer: 1,
    explanation: 'The oxide layer insulates the gate — DC gate current is essentially zero, giving very high input impedance.',
  },
  {
    id: 'q-ee-20', courseId: 'beee', moduleId: 'm6', moduleTitle: 'Operational Amplifiers', co: 'CO4', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'An inverting amplifier has R_in = 1 kΩ and R_f = 10 kΩ. Its closed-loop gain is:',
    options: ['−10', '10', '−11', '0.1'],
    answer: 0,
    explanation: 'Ideal inverting gain A_v = −R_f/R_in = −10/1 = −10.',
  },

  /* ── English (continued) ───────────────────────────────────────── */
  {
    id: 'q-en-7', courseId: 'english', moduleId: 'm1', moduleTitle: 'Technical Communication Fundamentals', co: 'CO1', bloom: 'Understand', paper: 'A', difficulty: 'Understand',
    text: 'The passive voice is preferable when:',
    options: ['It is always preferable', 'The actor is unknown or unimportant', 'Writing friendly emails', 'Never — active is always better'],
    answer: 1,
    explanation: 'When the doer is irrelevant or concealed, passive keeps focus on the action or object.',
  },
  {
    id: 'q-en-8', courseId: 'english', moduleId: 'm1', moduleTitle: 'Technical Communication Fundamentals', co: 'CO1', bloom: 'Remember', paper: 'B', difficulty: 'Remember',
    text: 'The abstract of a technical report is written:',
    options: ['Before the report', 'After the report is complete', 'Along with the title page only', 'By the reader'],
    answer: 1,
    explanation: 'An abstract summarises what was actually done and found — so it is drafted last.',
  },
  {
    id: 'q-en-9', courseId: 'english', moduleId: 'm1', moduleTitle: 'Technical Communication Fundamentals', co: 'CO1', bloom: 'Analyze', paper: 'A', difficulty: 'Analyze',
    text: 'Excessive nominalisation (e.g. "make a calculation" instead of "calculate") makes writing:',
    options: ['Shorter and sharper', 'Wordier and less direct', 'More objective always', 'Easier to scan'],
    answer: 1,
    explanation: 'Turning verbs into nouns adds syllables and hides the actor — strong technical style prefers lean verb forms.',
  },
  {
    id: 'q-en-10', courseId: 'english', moduleId: 'm2', moduleTitle: 'Speaking & Presentation Skills', co: 'CO2', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'The opening of a technical presentation should:',
    options: ['Read the slides aloud', 'State the purpose and preview the structure', 'Apologise for the topic', 'Start with references'],
    answer: 1,
    explanation: 'A roadmap opening tells the audience why they are there and what is coming — reducing cognitive load.',
  },
  {
    id: 'q-en-11', courseId: 'english', moduleId: 'm2', moduleTitle: 'Speaking & Presentation Skills', co: 'CO2', bloom: 'Understand', paper: 'B', difficulty: 'Understand',
    text: 'Effective presentation slides should contain:',
    options: ['Full paragraphs of text', 'Keywords and visuals, not paragraphs', 'The speaker script verbatim', 'Only decorative images'],
    answer: 1,
    explanation: 'Slides are signboards, not handouts — keywords plus visuals; the speaker supplies the detail.',
  },
  {
    id: 'q-en-12', courseId: 'english', moduleId: 'm3', moduleTitle: 'Technical Writing & Documentation', co: 'CO3', bloom: 'Remember', paper: 'A', difficulty: 'Remember',
    text: 'Operating instructions normally use the imperative mood in order to:',
    options: ['Give direct commands ("Click Save")', 'Sound polite only', 'Show tense practice', 'Avoid subjects entirely as a rule'],
    answer: 0,
    explanation: 'Imperative sentences ("Insert the card") give unambiguous, actor-neutral steps — the convention for manuals.',
  },
  {
    id: 'q-en-13', courseId: 'english', moduleId: 'm3', moduleTitle: 'Technical Writing & Documentation', co: 'CO3', bloom: 'Apply', paper: 'B', difficulty: 'Apply',
    text: 'The four standard heading fields of a memorandum are:',
    options: ['To, From, Date, Subject', 'Title, Body, Sign, Reference', 'Head, Sub, Foot, Tail', 'Author, Year, Title, Publisher'],
    answer: 0,
    explanation: 'The classic memo block: TO / FROM / DATE / SUBJECT — routing and context at a glance.',
  },
  {
    id: 'q-en-14', courseId: 'english', moduleId: 'm3', moduleTitle: 'Technical Writing & Documentation', co: 'CO3', bloom: 'Understand', paper: 'A', difficulty: 'Understand',
    text: 'The IMRaD structure stands for:',
    options: ['Introduction, Methods, Results and Discussion', 'Ideas, Maps, References and Data', 'Index, Materials, Rules and Drafts', 'Intro, Motive, Reason and Detail'],
    answer: 0,
    explanation: 'IMRaD is the standard scientific report skeleton: what we asked, how we did it, what we found, what it means.',
  },
  {
    id: 'q-en-15', courseId: 'english', moduleId: 'm4', moduleTitle: 'Workplace Communication & Ethics', co: 'CO4', bloom: 'Understand', paper: 'A', difficulty: 'Understand',
    text: 'Non-verbal cues in a job interview include:',
    options: ['Handwriting style', 'Tone of voice and body language', 'Punctuation choices', 'File naming'],
    answer: 1,
    explanation: 'Paralanguage, posture, eye contact and gestures carry much of the impression you make.',
  },
  {
    id: 'q-en-16', courseId: 'english', moduleId: 'm4', moduleTitle: 'Workplace Communication & Ethics', co: 'CO4', bloom: 'Apply', paper: 'B', difficulty: 'Apply',
    text: 'A well-written refusal email to a client should:',
    options: ['Ignore the request', 'Decline clearly, give a brief reason and offer an alternative', 'Blame a colleague', 'Postpone forever without a reply'],
    answer: 1,
    explanation: 'Professional refusal = direct answer + honest reason + goodwill gesture/alternative, kept brief.',
  },

  /* ── Engineering Graphics (continued) ──────────────────────────── */
  {
    id: 'q-gr-7', courseId: 'graphics', moduleId: 'm1', moduleTitle: 'Engineering Drawing Fundamentals', co: 'CO1', bloom: 'Remember', paper: 'A', difficulty: 'Remember',
    text: 'The standard BIS drawing sheet size A2 is:',
    options: ['420 × 594 mm', '297 × 420 mm', '594 × 841 mm', '210 × 297 mm'],
    answer: 0,
    explanation: 'A2 = 420 × 594 mm (A1 is 594 × 841, A3 is 297 × 420, A4 is 210 × 297).',
  },
  {
    id: 'q-gr-8', courseId: 'graphics', moduleId: 'm1', moduleTitle: 'Engineering Drawing Fundamentals', co: 'CO1', bloom: 'Apply', paper: 'B', difficulty: 'Apply',
    text: 'A dimension line is drawn as:',
    options: ['A thick dashed line', 'A thin continuous line with arrowheads at both ends', 'A chain line', 'A wavy freehand line'],
    answer: 1,
    explanation: 'Dimensions use thin continuous lines terminated by arrowheads, with the value above the line.',
  },
  {
    id: 'q-gr-9', courseId: 'graphics', moduleId: 'm1', moduleTitle: 'Engineering Drawing Fundamentals', co: 'CO1', bloom: 'Understand', paper: 'A', difficulty: 'Understand',
    text: 'A drawing marked "2:1 scale" means:',
    options: ['Half the actual size', 'Twice the actual size', 'Actual size', '2 mm equals 1 m'],
    answer: 1,
    explanation: 'Scale = drawing : actual, so 2:1 doubles every measured dimension on paper.',
  },
  {
    id: 'q-gr-10', courseId: 'graphics', moduleId: 'm2', moduleTitle: 'Orthographic Projections', co: 'CO2', bloom: 'Remember', paper: 'A', difficulty: 'Remember',
    text: 'In third-angle projection, the top view is placed:',
    options: ['Above the front view', 'Below the front view', 'To the left of the side view only', 'Overlapping the front view'],
    answer: 0,
    explanation: 'Third angle (US convention): each view sits on the plane on which it is projected — top above front.',
  },
  {
    id: 'q-gr-11', courseId: 'graphics', moduleId: 'm2', moduleTitle: 'Orthographic Projections', co: 'CO2', bloom: 'Apply', paper: 'B', difficulty: 'Apply',
    text: 'The front view of an object shows its:',
    options: ['Length and height', 'Length and width', 'Width and height', 'All three dimensions'],
    answer: 0,
    explanation: 'Front view projects onto the VP: horizontal dimension (length) × vertical dimension (height).',
  },
  {
    id: 'q-gr-12', courseId: 'graphics', moduleId: 'm2', moduleTitle: 'Orthographic Projections', co: 'CO2', bloom: 'Understand', paper: 'A', difficulty: 'Understand',
    text: 'In orthographic projection, projectors are:',
    options: ['Parallel to the projection plane', 'Perpendicular to the projection plane', 'At 30° to the plane', 'Random rays from the eye'],
    answer: 1,
    explanation: 'Ortho = right angle — all projectors strike the plane perpendicularly (unlike perspective).',
  },
  {
    id: 'q-gr-13', courseId: 'graphics', moduleId: 'm3', moduleTitle: 'Sections & Development of Surfaces', co: 'CO3', bloom: 'Remember', paper: 'B', difficulty: 'Remember',
    text: 'The cutting-plane line on a drawing is shown as:',
    options: ['A chain line with arrowheads indicating the viewing direction', 'A thick continuous outline', 'A thin dotted line', 'A wavy break line'],
    answer: 0,
    explanation: 'Long–short–long chain, thickened at the ends, with arrows showing which way the cut half is viewed.',
  },
  {
    id: 'q-gr-14', courseId: 'graphics', moduleId: 'm3', moduleTitle: 'Sections & Development of Surfaces', co: 'CO3', bloom: 'Apply', paper: 'A', difficulty: 'Apply',
    text: 'Section hatching lines are conventionally drawn at an angle of:',
    options: ['30°', '45°', '60°', '90°'],
    answer: 1,
    explanation: 'Thin continuous lines at 45°, evenly spaced, mark cut surfaces (adjacent parts hatch in opposite senses).',
  },
  {
    id: 'q-gr-15', courseId: 'graphics', moduleId: 'm4', moduleTitle: 'Isometric & Perspective Views', co: 'CO4', bloom: 'Understand', paper: 'A', difficulty: 'Understand',
    text: 'An isometric projection is drawn to a scale of approximately:',
    options: ['0.816 (≈ 82%)', '1.0 (full size)', '0.707 (≈ 71%)', '0.5 (half size)'],
    answer: 0,
    explanation: 'Projection along the body diagonal foreshortens by √(2/3) ≈ 0.816 — isometric view (true size) scales it back up.',
  },
  {
    id: 'q-gr-16', courseId: 'graphics', moduleId: 'm4', moduleTitle: 'Isometric & Perspective Views', co: 'CO4', bloom: 'Apply', paper: 'B', difficulty: 'Apply',
    text: 'In a perspective drawing, a set of parallel receding edges meets at a:',
    options: ['Station point', 'Vanishing point', 'Measuring point', 'Center line'],
    answer: 1,
    explanation: 'Parallel lines appear to converge at one vanishing point on the horizon (one-point perspective when only one set).',
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
