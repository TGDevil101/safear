import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import WorkerLogin from './pages/WorkerLogin'
import ModuleSelect from './pages/ModuleSelect'
import Train from './pages/Train'
import QuizPage from './pages/QuizPage'
import CertificatePage from './pages/Certificate'
import Verify from './pages/Verify'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

/** Routes are exactly those specified in PRD 6.4. */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/worker" replace />} />
        <Route path="/worker" element={<WorkerLogin />} />
        <Route path="/modules" element={<ModuleSelect />} />
        <Route path="/train/:moduleId" element={<Train />} />
        <Route path="/quiz/:moduleId" element={<QuizPage />} />
        <Route path="/certificate/:certId" element={<CertificatePage />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/worker" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
