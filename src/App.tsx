import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { NexusProvider } from '@/state/context';
import { AppShell } from '@/components/AppShell';
import { LandingPage } from '@/pages/LandingPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SyllabusPage } from '@/pages/SyllabusPage';
import { CoursePage } from '@/pages/CoursePage';
import { AIPage } from '@/pages/AIPage';
import { PlannerPage } from '@/pages/PlannerPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { LabsPage } from '@/pages/LabsPage';
import { SessionalsPage } from '@/pages/SessionalsPage';
import { SGPAPage } from '@/pages/SGPAPage';
import { PracticePage } from '@/pages/PracticePage';
import { ProfilePage } from '@/pages/ProfilePage';

function ShellRoute({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

export function App() {
  return (
    <NexusProvider>
      <HashRouter>
        <ScrollReset />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<ShellRoute><DashboardPage /></ShellRoute>} />
          <Route path="/syllabus" element={<ShellRoute><SyllabusPage /></ShellRoute>} />
          <Route path="/syllabus/:courseId" element={<ShellRoute><CoursePage /></ShellRoute>} />
          <Route path="/ai" element={<ShellRoute><AIPage /></ShellRoute>} />
          <Route path="/planner" element={<ShellRoute><PlannerPage /></ShellRoute>} />
          <Route path="/analytics" element={<ShellRoute><AnalyticsPage /></ShellRoute>} />
          <Route path="/labs" element={<ShellRoute><LabsPage /></ShellRoute>} />
          <Route path="/sessionals" element={<ShellRoute><SessionalsPage /></ShellRoute>} />
          <Route path="/sgpa" element={<ShellRoute><SGPAPage /></ShellRoute>} />
          <Route path="/practice" element={<ShellRoute><PracticePage /></ShellRoute>} />
          <Route path="/profile" element={<ShellRoute><ProfilePage /></ShellRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </NexusProvider>
  );
}

function ScrollReset() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
