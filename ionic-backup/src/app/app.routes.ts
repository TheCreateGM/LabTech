import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/start',
    pathMatch: 'full'
  },
  {
    path: 'start',
    loadComponent: () => import('./pages/start/start.page').then(m => m.StartPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage)
  },
  {
    path: 'geotechnical-lab',
    loadComponent: () => import('./pages/geotechnical-lab/geotechnical-lab.page').then(m => m.GeotechnicalLabPage)
  },
  {
    path: 'sieve-analysis',
    children: [
      {
        path: '',
        redirectTo: 'theory',
        pathMatch: 'full'
      },
      {
        path: 'theory',
        loadComponent: () => import('./pages/sieve-analysis/theory/sieve-analysis-theory.page').then(m => m.SieveAnalysisTheoryPage)
      },
      {
        path: 'procedure',
        loadComponent: () => import('./pages/sieve-analysis/procedure/sieve-analysis-procedure.page').then(m => m.SieveAnalysisProcedurePage)
      },
      {
        path: 'data',
        loadComponent: () => import('./pages/sieve-analysis/data/sieve-analysis-data.page').then(m => m.SieveAnalysisDataPage)
      },
      {
        path: 'calculation',
        loadComponent: () => import('./pages/sieve-analysis/calculation/sieve-analysis-calculation.page').then(m => m.SieveAnalysisCalculationPage)
      },
      {
        path: 'summary',
        loadComponent: () => import('./pages/sieve-analysis/summary/sieve-analysis-summary.page').then(m => m.SieveAnalysisSummaryPage)
      }
    ]
  },
  {
    path: 'proctor-test',
    children: [
      {
        path: '',
        redirectTo: 'theory',
        pathMatch: 'full'
      },
      {
        path: 'theory',
        loadComponent: () => import('./pages/proctor-test/theory/proctor-test-theory.page').then(m => m.ProctorTestTheoryPage)
      },
      {
        path: 'procedure',
        loadComponent: () => import('./pages/proctor-test/procedure/proctor-test-procedure.page').then(m => m.ProctorTestProcedurePage)
      },
      {
        path: 'data',
        loadComponent: () => import('./pages/proctor-test/data/proctor-test-data.page').then(m => m.ProctorTestDataPage)
      },
      {
        path: 'calculation',
        loadComponent: () => import('./pages/proctor-test/calculation/proctor-test-calculation.page').then(m => m.ProctorTestCalculationPage)
      },
      {
        path: 'discussion',
        loadComponent: () => import('./pages/proctor-test/discussion/proctor-test-discussion.page').then(m => m.ProctorTestDiscussionPage)
      },
      {
        path: 'conclusion',
        loadComponent: () => import('./pages/proctor-test/conclusion/proctor-test-conclusion.page').then(m => m.ProctorTestConclusionPage)
      }
    ]
  },
  {
    path: 'end',
    loadComponent: () => import('./pages/end/end.page').then(m => m.EndPage)
  }
];
