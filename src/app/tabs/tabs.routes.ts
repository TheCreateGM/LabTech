import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'tab1',
        loadComponent: () =>
          import('../tab1/tab1.page').then((m) => m.Tab1Page),
      },
      {
        path: 'tab2',
        loadComponent: () =>
          import('../tab2/tab2.page').then((m) => m.Tab2Page),
      },
      {
        path: 'tab3',
        loadComponent: () =>
          import('../tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        path: 'start',
        loadComponent: () => import('../pages/start/start.page').then(m => m.StartPage)
      },
      {
        path: 'home',
        loadComponent: () => import('../pages/home/home.page').then(m => m.HomePage)
      },
      {
        path: 'geotechnical-lab',
        loadComponent: () => import('../pages/geotechnical-lab/geotechnical-lab.page').then(m => m.GeotechnicalLabPage)
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
            loadComponent: () => import('../pages/sieve-analysis/theory/sieve-analysis-theory.page').then(m => m.SieveAnalysisTheoryPage)
          },
          {
            path: 'procedure',
            loadComponent: () => import('../pages/sieve-analysis/procedure/sieve-analysis-procedure.page').then(m => m.SieveAnalysisProcedurePage)
          },
          {
            path: 'data',
            loadComponent: () => import('../pages/sieve-analysis/data/sieve-analysis-data.page').then(m => m.SieveAnalysisDataPage)
          },
          {
            path: 'calculation',
            loadComponent: () => import('../pages/sieve-analysis/calculation/sieve-analysis-calculation.page').then(m => m.SieveAnalysisCalculationPage)
          },
          {
            path: 'summary',
            loadComponent: () => import('../pages/sieve-analysis/summary/sieve-analysis-summary.page').then(m => m.SieveAnalysisSummaryPage)
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
            loadComponent: () => import('../pages/proctor-test/theory/proctor-test-theory.page').then(m => m.ProctorTestTheoryPage)
          },
          {
            path: 'procedure',
            loadComponent: () => import('../pages/proctor-test/procedure/proctor-test-procedure.page').then(m => m.ProctorTestProcedurePage)
          },
          {
            path: 'data',
            loadComponent: () => import('../pages/proctor-test/data/proctor-test-data.page').then(m => m.ProctorTestDataPage)
          },
          {
            path: 'calculation',
            loadComponent: () => import('../pages/proctor-test/calculation/proctor-test-calculation.page').then(m => m.ProctorTestCalculationPage)
          },
          {
            path: 'discussion',
            loadComponent: () => import('../pages/proctor-test/discussion/proctor-test-discussion.page').then(m => m.ProctorTestDiscussionPage)
          },
          {
            path: 'conclusion',
            loadComponent: () => import('../pages/proctor-test/conclusion/proctor-test-conclusion.page').then(m => m.ProctorTestConclusionPage)
          }
        ]
      },
      {
        path: 'end',
        loadComponent: () => import('../pages/end/end.page').then(m => m.EndPage)
      },
      {
        path: 'admin',
        loadChildren: () => import('../admin/admin.routes').then(m => m.adminRoutes)
      },
      {
        path: '',
        redirectTo: '/tabs/tab1',
        pathMatch: 'full',
      },
    ],
  },
];
