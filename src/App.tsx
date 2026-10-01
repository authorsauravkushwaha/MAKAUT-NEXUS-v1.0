import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { NexusProvider, useNexus } from '@/state/context';
import { AppShell } from '@/components/AppShell';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
import { LibraryPage } from '@/pages/LibraryPage';
import { MockTestPage } from '@/pages/MockTestPage';
import { AtlasPage } from '@/pages/AtlasPage';
import { AuthPage } from '@/pages/AuthPage';

function ShellRoute({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <AppShell>
      {/* remount on navigation so a recovered route starts clean */}
      <ErrorBoundary key={pathname} inline>
        {children}
      </ErrorBoundary>
    </AppShell>
  );
}

/**
 * Requirement: nothing inside the site opens before sign-in / sign-up.
 * While the stored session is still restoring we show a splash instead of
 * bouncing a signed-in user to the login form.
 */
function GuardedShell() {
  const { cloud } = useNexus();
  const location = useLocation();
  if (cloud.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-nexus-bg font-sans text-[13px] text-slate-500">
        Opening the vault…
      </div>
    );
  }
  if (cloud.status !== 'signedin') {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }
  return <Outlet />;
}

export function App() {
  return (
    <NexusProvider>
      <HashRouter>
        <ScrollReset />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<ShellRoute><AuthPage /></ShellRoute>} />
          {/* Everything past the landing page requires a signed-in session. */}
          <Route element={<GuardedShell />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<ShellRoute><DashboardPage /></ShellRoute>} />
          <Route path="/atlas" element={<ShellRoute><AtlasPage /></ShellRoute>} />
          <Route path="/syllabus" element={<ShellRoute><SyllabusPage /></ShellRoute>} />
          <Route path="/syllabus/:courseId" element={<ShellRoute><CoursePage /></ShellRoute>} />
          <Route path="/library" element={<ShellRoute><LibraryPage /></ShellRoute>} />
          <Route path="/library/:subjectId" element={<ShellRoute><LibraryPage /></ShellRoute>} />
          <Route path="/library/:subjectId/:moduleId" element={<ShellRoute><LibraryPage /></ShellRoute>} />
          <Route path="/mock" element={<ShellRoute><MockTestPage /></ShellRoute>} />
          <Route path="/ai" element={<ShellRoute><AIPage /></ShellRoute>} />
          <Route path="/planner" element={<ShellRoute><PlannerPage /></ShellRoute>} />
          <Route path="/analytics" element={<ShellRoute><AnalyticsPage /></ShellRoute>} />
          <Route path="/labs" element={<ShellRoute><LabsPage /></ShellRoute>} />
          <Route path="/sessionals" element={<ShellRoute><SessionalsPage /></ShellRoute>} />
          <Route path="/sgpa" element={<ShellRoute><SGPAPage /></ShellRoute>} />
          <Route path="/practice" element={<ShellRoute><PracticePage /></ShellRoute>} />
          <Route path="/profile" element={<ShellRoute><ProfilePage /></ShellRoute>} />
          </Route>
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
