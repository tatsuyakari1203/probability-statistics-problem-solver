// Subject-specific configurations for different academic subjects

export type SubjectType = 'probability_statistics' | 'calculus' | 'linear_algebra' | 'physics' | 'chemistry' | 'general_math';

export interface SubjectConfig {
  id: SubjectType;
  name: string;
  description: string;
  promptModifications: {
    systemContext: string;
    problemAnalysisInstructions: string;
    solutionApproach: string;
    verificationCodeInstructions: string;
  };
  commonConcepts: string[];
  latexPackages?: string[];
}

export const SUBJECT_CONFIGS: Record<SubjectType, SubjectConfig> = {
  probability_statistics: {
    id: 'probability_statistics',
    name: 'Probability & Statistics',
    description: 'Problems involving probability theory, statistical analysis, distributions, and data interpretation',
    promptModifications: {
      systemContext: 'You are an expert in probability and statistics.',
      problemAnalysisInstructions: 'Focus on identifying probability distributions, statistical measures, sample spaces, events, and data characteristics.',
      solutionApproach: 'Use probability theory, statistical formulas, and data analysis techniques. Consider distributions, hypothesis testing, confidence intervals, and descriptive statistics.',
      verificationCodeInstructions: 'Write JavaScript code using mathematical functions for probability calculations, statistical tests, and data analysis. Use appropriate statistical formulas and probability distributions.'
    },
    commonConcepts: [
      'probability distributions', 'random variables', 'expected value', 'variance',
      'hypothesis testing', 'confidence intervals', 'correlation', 'regression',
      'normal distribution', 'binomial distribution', 'Poisson distribution'
    ],
    latexPackages: ['amsmath', 'amssymb', 'mathtools']
  },

  calculus: {
    id: 'calculus',
    name: 'Calculus',
    description: 'Problems involving derivatives, integrals, limits, and applications of calculus',
    promptModifications: {
      systemContext: 'You are an expert in calculus and mathematical analysis.',
      problemAnalysisInstructions: 'Identify functions, variables, limits, derivatives, integrals, and their applications. Look for optimization problems, related rates, and area/volume calculations.',
      solutionApproach: 'Apply differentiation and integration techniques. Use fundamental theorem of calculus, chain rule, product rule, quotient rule, and various integration methods.',
      verificationCodeInstructions: 'Write JavaScript code for numerical differentiation, integration, and limit calculations. Use appropriate mathematical libraries or implement numerical methods.'
    },
    commonConcepts: [
      'limits', 'derivatives', 'integrals', 'chain rule', 'product rule',
      'optimization', 'related rates', 'area under curves', 'volume of revolution',
      'Taylor series', 'L\'Hôpital\'s rule'
    ],
    latexPackages: ['amsmath', 'amssymb', 'mathtools']
  },

  linear_algebra: {
    id: 'linear_algebra',
    name: 'Linear Algebra',
    description: 'Problems involving vectors, matrices, linear transformations, and vector spaces',
    promptModifications: {
      systemContext: 'You are an expert in linear algebra and matrix theory.',
      problemAnalysisInstructions: 'Identify vectors, matrices, linear systems, transformations, eigenvalues, and vector spaces. Look for problems involving matrix operations, determinants, and linear independence.',
      solutionApproach: 'Use matrix operations, vector calculations, linear transformations, and eigenvalue analysis. Apply concepts of linear independence, basis, and dimension.',
      verificationCodeInstructions: 'Write JavaScript code for matrix operations, vector calculations, determinants, eigenvalues, and solving linear systems. Implement or use matrix algebra functions.'
    },
    commonConcepts: [
      'vectors', 'matrices', 'determinants', 'eigenvalues', 'eigenvectors',
      'linear transformations', 'vector spaces', 'linear independence',
      'basis', 'dimension', 'matrix multiplication'
    ],
    latexPackages: ['amsmath', 'amssymb', 'mathtools']
  },

  physics: {
    id: 'physics',
    name: 'Physics',
    description: 'Problems involving mechanics, thermodynamics, electromagnetism, and other physics concepts',
    promptModifications: {
      systemContext: 'You are an expert in physics with deep understanding of physical laws and mathematical modeling.',
      problemAnalysisInstructions: 'Identify physical quantities, units, forces, energy, motion, fields, and physical laws. Look for conservation principles, equilibrium conditions, and physical constraints.',
      solutionApproach: 'Apply fundamental physics laws, conservation principles, and mathematical modeling. Use appropriate physical formulas and consider units throughout the solution.',
      verificationCodeInstructions: 'Write JavaScript code that implements physics formulas and calculations. Include proper unit handling and physical constants. Verify results against known physical principles.'
    },
    commonConcepts: [
      'kinematics', 'dynamics', 'energy', 'momentum', 'forces',
      'electric fields', 'magnetic fields', 'waves', 'thermodynamics',
      'conservation laws', 'Newton\'s laws'
    ],
    latexPackages: ['amsmath', 'amssymb', 'physics', 'siunitx']
  },

  chemistry: {
    id: 'chemistry',
    name: 'Chemistry',
    description: 'Problems involving chemical reactions, stoichiometry, thermochemistry, and molecular behavior',
    promptModifications: {
      systemContext: 'You are an expert in chemistry with comprehensive knowledge of chemical principles and calculations.',
      problemAnalysisInstructions: 'Identify chemical species, reactions, stoichiometric relationships, concentrations, and chemical properties. Look for equilibrium conditions, reaction mechanisms, and molecular interactions.',
      solutionApproach: 'Apply chemical principles, stoichiometry, equilibrium concepts, and thermochemical calculations. Use appropriate chemical formulas and consider molecular behavior.',
      verificationCodeInstructions: 'Write JavaScript code for chemical calculations including stoichiometry, concentration calculations, equilibrium constants, and thermochemical computations. Include proper unit conversions.'
    },
    commonConcepts: [
      'stoichiometry', 'molarity', 'chemical equilibrium', 'reaction rates',
      'thermochemistry', 'acid-base chemistry', 'oxidation-reduction',
      'molecular geometry', 'gas laws', 'solution chemistry'
    ],
    latexPackages: ['amsmath', 'amssymb', 'mhchem', 'siunitx']
  },

  general_math: {
    id: 'general_math',
    name: 'General Mathematics',
    description: 'General mathematical problems including algebra, geometry, number theory, and discrete mathematics',
    promptModifications: {
      systemContext: 'You are an expert mathematician with broad knowledge across mathematical disciplines.',
      problemAnalysisInstructions: 'Identify mathematical structures, patterns, equations, geometric relationships, and logical constraints. Determine the appropriate mathematical approach and tools needed.',
      solutionApproach: 'Apply appropriate mathematical techniques including algebraic manipulation, geometric reasoning, logical deduction, and computational methods.',
      verificationCodeInstructions: 'Write JavaScript code that implements the mathematical calculations and verifies the solution using appropriate algorithms and mathematical functions.'
    },
    commonConcepts: [
      'algebra', 'geometry', 'trigonometry', 'number theory',
      'discrete mathematics', 'combinatorics', 'graph theory',
      'mathematical logic', 'set theory'
    ],
    latexPackages: ['amsmath', 'amssymb', 'mathtools']
  }
};

// Export alias for backward compatibility
export const SUBJECTS = SUBJECT_CONFIGS;

// Helper function to get subject config
export const getSubjectConfig = (subjectType: SubjectType): SubjectConfig => {
  return SUBJECT_CONFIGS[subjectType];
};

// Helper function to detect subject from problem description
export const detectSubjectFromProblem = (problemDescription: string): SubjectType => {
  const text = problemDescription.toLowerCase();
  
  // Physics keywords
  const physicsKeywords = ['force', 'velocity', 'acceleration', 'energy', 'momentum', 'electric', 'magnetic', 'wave', 'frequency', 'mass', 'newton', 'joule', 'watt', 'volt', 'ampere', 'field', 'motion', 'gravity', 'friction', 'pressure', 'temperature', 'heat', 'work', 'power'];
  
  // Chemistry keywords
  const chemistryKeywords = ['molecule', 'atom', 'reaction', 'mole', 'molarity', 'concentration', 'equilibrium', 'acid', 'base', 'ph', 'oxidation', 'reduction', 'catalyst', 'bond', 'electron', 'proton', 'neutron', 'compound', 'element', 'solution', 'solvent', 'solute'];
  
  // Calculus keywords
  const calculusKeywords = ['derivative', 'integral', 'limit', 'differentiate', 'integrate', 'optimization', 'maximum', 'minimum', 'rate of change', 'area under', 'volume', 'tangent', 'slope', 'continuous', 'discontinuous'];
  
  // Linear Algebra keywords
  const linearAlgebraKeywords = ['matrix', 'vector', 'determinant', 'eigenvalue', 'eigenvector', 'linear transformation', 'basis', 'dimension', 'span', 'linear independence', 'dot product', 'cross product'];
  
  // Probability & Statistics keywords
  const probabilityStatsKeywords = ['probability', 'statistics', 'random', 'distribution', 'mean', 'median', 'mode', 'variance', 'standard deviation', 'correlation', 'regression', 'hypothesis', 'confidence interval', 'sample', 'population', 'normal distribution', 'binomial', 'poisson'];
  
  // Count keyword matches
  const physicsCount = physicsKeywords.filter(keyword => text.includes(keyword)).length;
  const chemistryCount = chemistryKeywords.filter(keyword => text.includes(keyword)).length;
  const calculusCount = calculusKeywords.filter(keyword => text.includes(keyword)).length;
  const linearAlgebraCount = linearAlgebraKeywords.filter(keyword => text.includes(keyword)).length;
  const probabilityStatsCount = probabilityStatsKeywords.filter(keyword => text.includes(keyword)).length;
  
  // Find the subject with the highest keyword count
  const counts = {
    physics: physicsCount,
    chemistry: chemistryCount,
    calculus: calculusCount,
    linear_algebra: linearAlgebraCount,
    probability_statistics: probabilityStatsCount
  };
  
  const maxCount = Math.max(...Object.values(counts));
  
  if (maxCount === 0) {
    return 'general_math'; // Default fallback
  }
  
  // Return the subject with the highest count
  for (const [subject, count] of Object.entries(counts)) {
    if (count === maxCount) {
      return subject as SubjectType;
    }
  }
  
  return 'general_math'; // Fallback
};