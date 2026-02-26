'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { listSchedules, getScheduleLogs, pauseSchedule, resumeSchedule, cronToHuman, triggerScheduleNow } from '@/lib/scheduler'
import type { Schedule, ExecutionLog } from '@/lib/scheduler'
import { FiGithub, FiRefreshCw, FiCode, FiClock, FiCheckCircle, FiAlertTriangle, FiAlertCircle, FiActivity, FiList, FiUsers, FiTrendingUp, FiSettings, FiPlay, FiPause, FiZap, FiStar, FiFileText, FiGitPullRequest, FiGitMerge, FiMessageSquare, FiTarget, FiShield, FiLayers, FiDatabase, FiCalendar, FiArrowRight, FiEye, FiHash, FiBook } from 'react-icons/fi'

// ============================================================================
// Constants
// ============================================================================

const AGENT_IDS = {
  PROJECT_SYNC_MANAGER: '699fec5197fc9c57f6999957',
  GITHUB_DATA_AGENT: '699fec36903888ea805f4114',
  NOTION_SYNC_AGENT: '699fec3710134bfe58ea5fef',
  CODE_REVIEW_AGENT: '699fec3760c6ee660b2b0cd0',
  PROGRESS_REMINDER_AGENT: '699fec3860c6ee660b2b0cd2',
}

const AGENTS_INFO = [
  { id: AGENT_IDS.PROJECT_SYNC_MANAGER, name: 'Project Sync Manager', purpose: 'Coordinates GitHub + Notion sync and project summary' },
  { id: AGENT_IDS.GITHUB_DATA_AGENT, name: 'GitHub Data Agent', purpose: 'Fetches issues, PRs, commits from GitHub' },
  { id: AGENT_IDS.NOTION_SYNC_AGENT, name: 'Notion Sync Agent', purpose: 'Syncs tasks and data to Notion' },
  { id: AGENT_IDS.CODE_REVIEW_AGENT, name: 'Code Review Agent', purpose: 'Analyzes PRs for quality, bugs, best practices' },
  { id: AGENT_IDS.PROGRESS_REMINDER_AGENT, name: 'Progress Reminder Agent', purpose: 'Tracks progress, overdue tasks, generates reminders' },
]

// ============================================================================
// Types
// ============================================================================

interface TaskItem {
  title: string
  type: string
  priority: string
  assignee: string
  source: string
}

interface ProjectSummary {
  project_name?: string
  last_synced?: string
  health_status?: string
  completion_percentage?: number
  total_tasks?: number
  highlights?: string
  blockers?: string
}

interface SyncReport {
  github_status?: string
  notion_status?: string
  items_synced?: number
  sync_timestamp?: string
}

interface Contributor {
  name: string
  contributions: number
}

interface SyncManagerResult {
  project_summary?: ProjectSummary
  task_list?: {
    todo?: TaskItem[]
    in_progress?: TaskItem[]
    done?: TaskItem[]
  }
  sync_report?: SyncReport
  active_contributors?: Contributor[]
}

interface QualityMetrics {
  readability?: number
  maintainability?: number
  performance?: number
  security?: number
}

interface BugItem {
  severity: string
  description: string
  file: string
  suggestion: string
}

interface ImprovementItem {
  category: string
  description: string
  priority: string
}

interface BestPracticeItem {
  practice: string
  status: string
  note: string
}

interface CodeReviewResult {
  pr_number?: number
  repository?: string
  overall_score?: number
  recommendation?: string
  summary?: string
  quality_metrics?: QualityMetrics
  bugs_found?: BugItem[]
  improvements?: ImprovementItem[]
  best_practices?: BestPracticeItem[]
}

interface ProgressSummaryMetrics {
  tasks_completed?: number
  tasks_in_progress?: number
  tasks_overdue?: number
  upcoming_deadlines?: number
  completion_rate?: number
}

interface OverdueItem {
  title: string
  due_date: string
  days_overdue: number
  assignee: string
}

interface UpcomingTask {
  title: string
  due_date: string
  days_remaining: number
  assignee: string
}

interface FocusArea {
  area: string
  reason: string
  priority: string
}

interface ProgressResult {
  report_date?: string
  progress_summary?: ProgressSummaryMetrics
  overdue_items?: OverdueItem[]
  upcoming_tasks?: UpcomingTask[]
  focus_areas?: FocusArea[]
  message?: string
  reminder_posted?: boolean
}

// ============================================================================
// Sample Data
// ============================================================================

const SAMPLE_SYNC_DATA: SyncManagerResult = {
  project_summary: {
    project_name: 'acme-corp/web-platform',
    last_synced: '2026-02-26T09:15:00Z',
    health_status: 'Good',
    completion_percentage: 68,
    total_tasks: 42,
    highlights: 'Authentication module completed ahead of schedule. API v2 endpoints passing all integration tests. New dashboard design approved by stakeholders.',
    blockers: 'Database migration script failing on production replica. Waiting on third-party API credentials for payment integration.',
  },
  task_list: {
    todo: [
      { title: 'Implement payment gateway integration', type: 'feature', priority: 'high', assignee: 'sarah-chen', source: 'GitHub' },
      { title: 'Write E2E tests for checkout flow', type: 'task', priority: 'medium', assignee: 'alex-kim', source: 'Notion' },
      { title: 'Update API documentation for v2', type: 'docs', priority: 'low', assignee: 'jamie-lee', source: 'GitHub' },
    ],
    in_progress: [
      { title: 'Database migration to PostgreSQL 16', type: 'infrastructure', priority: 'critical', assignee: 'mike-ross', source: 'GitHub' },
      { title: 'Redesign user settings page', type: 'feature', priority: 'medium', assignee: 'lisa-park', source: 'Notion' },
    ],
    done: [
      { title: 'OAuth2 authentication module', type: 'feature', priority: 'high', assignee: 'sarah-chen', source: 'GitHub' },
      { title: 'API v2 endpoint refactoring', type: 'refactor', priority: 'high', assignee: 'mike-ross', source: 'GitHub' },
      { title: 'CI/CD pipeline optimization', type: 'infrastructure', priority: 'medium', assignee: 'alex-kim', source: 'Notion' },
    ],
  },
  sync_report: {
    github_status: 'Connected',
    notion_status: 'Connected',
    items_synced: 42,
    sync_timestamp: '2026-02-26T09:15:00Z',
  },
  active_contributors: [
    { name: 'sarah-chen', contributions: 47 },
    { name: 'mike-ross', contributions: 38 },
    { name: 'alex-kim', contributions: 29 },
    { name: 'lisa-park', contributions: 22 },
    { name: 'jamie-lee', contributions: 15 },
  ],
}

const SAMPLE_REVIEW_DATA: CodeReviewResult = {
  pr_number: 142,
  repository: 'acme-corp/web-platform',
  overall_score: 7,
  recommendation: 'approve',
  summary: 'This PR implements the user authentication middleware with JWT token validation. The code is well-structured with proper error handling. Minor improvements suggested for logging and input validation edge cases.',
  quality_metrics: { readability: 8, maintainability: 7, performance: 6, security: 8 },
  bugs_found: [
    { severity: 'medium', description: 'Token expiry check does not account for clock skew between servers', file: 'src/middleware/auth.ts', suggestion: 'Add a configurable clock tolerance (e.g., 30 seconds) when validating token expiry timestamps.' },
    { severity: 'low', description: 'Missing null check on optional user profile fields', file: 'src/utils/userProfile.ts', suggestion: 'Use optional chaining when accessing nested profile properties.' },
  ],
  improvements: [
    { category: 'Logging', description: 'Add structured logging with correlation IDs for authentication attempts', priority: 'medium' },
    { category: 'Performance', description: 'Cache decoded JWT tokens for repeated requests within the same session', priority: 'low' },
    { category: 'Security', description: 'Implement rate limiting on the token refresh endpoint', priority: 'high' },
  ],
  best_practices: [
    { practice: 'Input Validation', status: 'pass', note: 'All inputs are validated using Zod schemas' },
    { practice: 'Error Handling', status: 'pass', note: 'Consistent error response format across all endpoints' },
    { practice: 'Type Safety', status: 'pass', note: 'Full TypeScript coverage with strict mode enabled' },
    { practice: 'Test Coverage', status: 'partial', note: 'Unit tests present but missing integration tests for edge cases' },
    { practice: 'Documentation', status: 'fail', note: 'JSDoc comments missing on exported functions' },
  ],
}

const SAMPLE_PROGRESS_DATA: ProgressResult = {
  report_date: '2026-02-26',
  progress_summary: { tasks_completed: 12, tasks_in_progress: 8, tasks_overdue: 3, upcoming_deadlines: 5, completion_rate: 68 },
  overdue_items: [
    { title: 'Database migration script', due_date: '2026-02-22', days_overdue: 4, assignee: 'mike-ross' },
    { title: 'Payment API integration spec', due_date: '2026-02-24', days_overdue: 2, assignee: 'sarah-chen' },
    { title: 'Security audit report', due_date: '2026-02-25', days_overdue: 1, assignee: 'alex-kim' },
  ],
  upcoming_tasks: [
    { title: 'E2E test suite for auth flow', due_date: '2026-02-28', days_remaining: 2, assignee: 'alex-kim' },
    { title: 'API v2 documentation update', due_date: '2026-03-01', days_remaining: 3, assignee: 'jamie-lee' },
    { title: 'Dashboard redesign review', due_date: '2026-03-03', days_remaining: 5, assignee: 'lisa-park' },
  ],
  focus_areas: [
    { area: 'Database Migration', reason: '4 days overdue - blocking deployment pipeline', priority: 'critical' },
    { area: 'Test Coverage', reason: 'Auth module lacks integration tests before release', priority: 'high' },
    { area: 'Documentation', reason: 'API v2 docs needed before partner onboarding', priority: 'medium' },
  ],
  message: 'Daily progress check complete. 3 overdue items require immediate attention. Database migration is the top priority blocker.',
  reminder_posted: true,
}

// ============================================================================
// Helpers
// ============================================================================

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1 text-slate-200">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1 text-slate-200">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2 text-slate-100">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm text-slate-300">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm text-slate-300">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm text-slate-300">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-100">{part}</strong> : part)
}

function getPriorityColor(priority: string): string {
  const p = (priority ?? '').toLowerCase()
  if (p === 'critical') return 'bg-red-500/20 text-red-400 border-red-500/30'
  if (p === 'high') return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  if (p === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  if (p === 'low') return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
}

function getSeverityColor(severity: string): string {
  const s = (severity ?? '').toLowerCase()
  if (s === 'critical') return 'bg-red-500/20 text-red-400 border-red-500/30'
  if (s === 'high') return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  if (s === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  if (s === 'low') return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
}

function getTypeColor(type: string): string {
  const t = (type ?? '').toLowerCase()
  if (t === 'feature') return 'bg-indigo-500/20 text-indigo-400'
  if (t === 'bug' || t === 'bugfix') return 'bg-red-500/20 text-red-400'
  if (t === 'task') return 'bg-emerald-500/20 text-emerald-400'
  if (t === 'infrastructure') return 'bg-purple-500/20 text-purple-400'
  if (t === 'refactor') return 'bg-cyan-500/20 text-cyan-400'
  if (t === 'docs') return 'bg-amber-500/20 text-amber-400'
  return 'bg-slate-500/20 text-slate-400'
}

function getScoreColor(score: number): string {
  if (score >= 8) return 'text-emerald-400'
  if (score >= 5) return 'text-yellow-400'
  return 'text-red-400'
}

function getScoreBgColor(score: number): string {
  if (score >= 8) return 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30'
  if (score >= 5) return 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30'
  return 'from-red-500/20 to-red-500/5 border-red-500/30'
}

function getHealthIcon(status: string) {
  const s = (status ?? '').toLowerCase()
  if (s === 'good' || s === 'healthy') return <FiCheckCircle className="w-5 h-5 text-emerald-400" />
  if (s === 'warning' || s === 'at risk') return <FiAlertTriangle className="w-5 h-5 text-yellow-400" />
  return <FiAlertCircle className="w-5 h-5 text-red-400" />
}

function getHealthColor(status: string): string {
  const s = (status ?? '').toLowerCase()
  if (s === 'good' || s === 'healthy') return 'text-emerald-400'
  if (s === 'warning' || s === 'at risk') return 'text-yellow-400'
  return 'text-red-400'
}

function getStatusIcon(status: string) {
  const s = (status ?? '').toLowerCase()
  if (s === 'pass' || s === 'passed') return <FiCheckCircle className="w-4 h-4 text-emerald-400" />
  if (s === 'partial') return <FiAlertTriangle className="w-4 h-4 text-yellow-400" />
  return <FiAlertCircle className="w-4 h-4 text-red-400" />
}

function getRecommendationStyle(rec: string): string {
  const r = (rec ?? '').toLowerCase()
  if (r === 'approve') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  if (r === 'request_changes' || r === 'request changes') return 'bg-red-500/20 text-red-400 border-red-500/30'
  return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
}

// ============================================================================
// ErrorBoundary
// ============================================================================

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-slate-400 mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-500 transition-colors">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ============================================================================
// Sub-components
// ============================================================================

function TaskCard({ task }: { task: TaskItem }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3 hover:border-slate-600/70 transition-all duration-200">
      <p className="text-sm font-medium text-slate-200 mb-2 leading-snug">{task?.title ?? 'Untitled'}</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(task?.type ?? '')}`}>{task?.type ?? 'task'}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(task?.priority ?? '')}`}>{task?.priority ?? 'medium'}</span>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1"><FiUsers className="w-3 h-3" />{task?.assignee ?? 'Unassigned'}</span>
        <span className="flex items-center gap-1">{task?.source === 'GitHub' ? <FiGithub className="w-3 h-3" /> : <FiBook className="w-3 h-3" />}{task?.source ?? ''}</span>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function QualityBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const safeVal = value ?? 0
  const pct = Math.min(Math.max(safeVal / 10 * 100, 0), 100)
  const barColor = safeVal >= 8 ? 'bg-emerald-500' : safeVal >= 5 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-slate-300">{icon}{label}</span>
        <span className="font-semibold text-slate-200">{safeVal}/10</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function AgentStatusPanel({ activeAgentId }: { activeAgentId: string | null }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 mt-6">
      <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><FiLayers className="w-4 h-4 text-indigo-400" />Agent Status</h3>
      <div className="space-y-2">
        {AGENTS_INFO.map((agent) => (
          <div key={agent.id} className={`flex items-center gap-2 text-xs p-2 rounded-lg transition-all duration-200 ${activeAgentId === agent.id ? 'bg-indigo-500/10 border border-indigo-500/30' : 'bg-slate-900/40'}`}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeAgentId === agent.id ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
            <div className="min-w-0 flex-1">
              <span className={`font-medium ${activeAgentId === agent.id ? 'text-indigo-300' : 'text-slate-400'}`}>{agent.name}</span>
              <span className="text-slate-500 ml-2 hidden sm:inline">-- {agent.purpose}</span>
            </div>
            {activeAgentId === agent.id && <FiRefreshCw className="w-3 h-3 text-indigo-400 animate-spin flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Tab: Dashboard
// ============================================================================

function DashboardTab({
  owner, setOwner, repo, setRepo,
  syncResult, syncLoading, syncError, onSync,
  sampleMode
}: {
  owner: string; setOwner: (v: string) => void
  repo: string; setRepo: (v: string) => void
  syncResult: SyncManagerResult | null
  syncLoading: boolean; syncError: string | null
  onSync: () => void
  sampleMode: boolean
}) {
  const data = sampleMode ? SAMPLE_SYNC_DATA : syncResult
  const summary = data?.project_summary
  const taskList = data?.task_list
  const report = data?.sync_report
  const contributors = Array.isArray(data?.active_contributors) ? data.active_contributors : []
  const todoTasks = Array.isArray(taskList?.todo) ? taskList.todo : []
  const inProgressTasks = Array.isArray(taskList?.in_progress) ? taskList.in_progress : []
  const doneTasks = Array.isArray(taskList?.done) ? taskList.done : []
  const completionPct = summary?.completion_percentage ?? 0

  return (
    <div className="space-y-6">
      {/* Config Section */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><FiSettings className="w-4 h-4 text-indigo-400" />Repository Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">GitHub Owner</label>
            <div className="relative">
              <FiGithub className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="e.g. acme-corp" className="w-full bg-slate-900/60 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Repository Name</label>
            <div className="relative">
              <FiDatabase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="e.g. web-platform" className="w-full bg-slate-900/60 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors" />
            </div>
          </div>
        </div>
        <button onClick={onSync} disabled={syncLoading || (!owner && !sampleMode) || (!repo && !sampleMode)} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm">
          {syncLoading ? <><FiRefreshCw className="w-4 h-4 animate-spin" />Syncing Project...</> : <><FiZap className="w-4 h-4" />Sync and Summarize Project</>}
        </button>
      </div>

      {/* Error */}
      {syncError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Sync Failed</p>
            <p className="text-xs text-red-400/70 mt-1">{syncError}</p>
          </div>
        </div>
      )}

      {/* No data */}
      {!data && !syncLoading && !syncError && (
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-12 text-center">
          <FiActivity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No project data yet. Enter your repository details and click Sync and Summarize to get started.</p>
        </div>
      )}

      {/* Loading skeleton */}
      {syncLoading && !data && (
        <div className="space-y-4">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-5 bg-slate-700 rounded w-1/3" />
              <div className="h-3 bg-slate-700 rounded w-2/3" />
              <div className="h-3 bg-slate-700 rounded w-1/2" />
              <div className="h-8 bg-slate-700 rounded w-full mt-4" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((k) => (
              <div key={k} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-1/2" />
                  <div className="h-16 bg-slate-700 rounded" />
                  <div className="h-16 bg-slate-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {data && (
        <>
          {/* Project Summary */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FiGithub className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{summary?.project_name ?? 'Project'}</h3>
                  <p className="text-xs text-slate-500">Last synced: {summary?.last_synced ?? 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getHealthIcon(summary?.health_status ?? '')}
                <span className={`text-sm font-medium ${getHealthColor(summary?.health_status ?? '')}`}>{summary?.health_status ?? 'Unknown'}</span>
              </div>
            </div>

            {/* Completion bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-400">Overall Completion</span>
                <span className="font-semibold text-indigo-400">{completionPct}%</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-700" style={{ width: `${Math.min(completionPct, 100)}%` }} />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
              <FiList className="w-4 h-4" />
              <span>Total Tasks: <strong className="text-slate-200">{summary?.total_tasks ?? 0}</strong></span>
            </div>

            {/* Highlights & Blockers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5"><FiStar className="w-3.5 h-3.5" />Highlights</h4>
                <div className="text-sm text-slate-300">{renderMarkdown(summary?.highlights ?? 'No highlights available.')}</div>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1.5"><FiAlertTriangle className="w-3.5 h-3.5" />Blockers</h4>
                <div className="text-sm text-slate-300">{renderMarkdown(summary?.blockers ?? 'No blockers reported.')}</div>
              </div>
            </div>
          </div>

          {/* Task Board */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><FiList className="w-4 h-4 text-indigo-400" />Task Board</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* To Do */}
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/50">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <h4 className="text-sm font-semibold text-slate-300">To Do</h4>
                  <span className="text-xs bg-slate-700 text-slate-400 rounded-full px-2 py-0.5 ml-auto">{todoTasks.length}</span>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {todoTasks.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No tasks</p>}
                  {todoTasks.map((t, i) => <TaskCard key={i} task={t} />)}
                </div>
              </div>
              {/* In Progress */}
              <div className="bg-slate-800/40 border border-indigo-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/50">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                  <h4 className="text-sm font-semibold text-slate-300">In Progress</h4>
                  <span className="text-xs bg-indigo-500/20 text-indigo-400 rounded-full px-2 py-0.5 ml-auto">{inProgressTasks.length}</span>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {inProgressTasks.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No tasks</p>}
                  {inProgressTasks.map((t, i) => <TaskCard key={i} task={t} />)}
                </div>
              </div>
              {/* Done */}
              <div className="bg-slate-800/40 border border-emerald-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/50">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <h4 className="text-sm font-semibold text-slate-300">Done</h4>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 rounded-full px-2 py-0.5 ml-auto">{doneTasks.length}</span>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {doneTasks.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No tasks</p>}
                  {doneTasks.map((t, i) => <TaskCard key={i} task={t} />)}
                </div>
              </div>
            </div>
          </div>

          {/* Sync Report & Contributors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sync Report */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><FiRefreshCw className="w-4 h-4 text-indigo-400" />Sync Report</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-400"><FiGithub className="w-4 h-4" />GitHub</span>
                  <span className={`font-medium ${(report?.github_status ?? '').toLowerCase() === 'connected' ? 'text-emerald-400' : 'text-red-400'}`}>{report?.github_status ?? 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-400"><FiBook className="w-4 h-4" />Notion</span>
                  <span className={`font-medium ${(report?.notion_status ?? '').toLowerCase() === 'connected' ? 'text-emerald-400' : 'text-red-400'}`}>{report?.notion_status ?? 'Unknown'}</span>
                </div>
                <div className="border-t border-slate-700/50 pt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Items Synced</span>
                  <span className="font-bold text-indigo-400 text-lg">{report?.items_synced ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Sync Timestamp</span>
                  <span>{report?.sync_timestamp ?? 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Contributors */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><FiUsers className="w-4 h-4 text-indigo-400" />Active Contributors</h3>
              {contributors.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No contributor data</p>
              ) : (
                <div className="space-y-2.5">
                  {contributors.map((c, i) => {
                    const maxContrib = Math.max(...contributors.map(x => x?.contributions ?? 0), 1)
                    const pct = ((c?.contributions ?? 0) / maxContrib) * 100
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-300 flex items-center gap-2"><FiGithub className="w-3 h-3 text-slate-500" />{c?.name ?? 'Unknown'}</span>
                          <span className="text-indigo-400 font-medium">{c?.contributions ?? 0}</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// Tab: Code Review
// ============================================================================

function CodeReviewTab({
  owner, repo,
  reviewResult, reviewLoading, reviewError, onReview,
  prNumber, setPrNumber,
  sampleMode
}: {
  owner: string; repo: string
  reviewResult: CodeReviewResult | null
  reviewLoading: boolean; reviewError: string | null
  onReview: () => void
  prNumber: string; setPrNumber: (v: string) => void
  sampleMode: boolean
}) {
  const data = sampleMode ? SAMPLE_REVIEW_DATA : reviewResult
  const score = data?.overall_score ?? 0
  const metrics = data?.quality_metrics
  const bugs = Array.isArray(data?.bugs_found) ? data.bugs_found : []
  const improvements = Array.isArray(data?.improvements) ? data.improvements : []
  const practices = Array.isArray(data?.best_practices) ? data.best_practices : []

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><FiGitPullRequest className="w-4 h-4 text-indigo-400" />Pull Request Review</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Repository Owner</label>
            <input type="text" value={owner} readOnly className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 cursor-not-allowed opacity-60" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Repository Name</label>
            <input type="text" value={repo} readOnly className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 cursor-not-allowed opacity-60" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">PR Number</label>
            <div className="relative">
              <FiHash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" value={prNumber} onChange={(e) => setPrNumber(e.target.value)} placeholder="e.g. 142" className="w-full bg-slate-900/60 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors" />
            </div>
          </div>
        </div>
        <button onClick={onReview} disabled={reviewLoading || (!prNumber && !sampleMode)} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm">
          {reviewLoading ? <><FiRefreshCw className="w-4 h-4 animate-spin" />Analyzing PR...</> : <><FiCode className="w-4 h-4" />Review Code</>}
        </button>
      </div>

      {/* Error */}
      {reviewError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Review Failed</p>
            <p className="text-xs text-red-400/70 mt-1">{reviewError}</p>
          </div>
        </div>
      )}

      {/* No data */}
      {!data && !reviewLoading && !reviewError && (
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-12 text-center">
          <FiCode className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No review data yet. Enter a PR number and click Review Code to analyze a pull request.</p>
        </div>
      )}

      {/* Loading */}
      {reviewLoading && !data && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex gap-4">
              <div className="h-24 w-24 bg-slate-700 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2 py-3">
                <div className="h-5 bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-700 rounded w-2/3" />
                <div className="h-3 bg-slate-700 rounded w-1/2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(k => <div key={k} className="h-12 bg-slate-700 rounded" />)}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {data && (
        <>
          {/* Score & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Score Gauge */}
            <div className={`bg-gradient-to-br ${getScoreBgColor(score)} border rounded-xl p-5 flex flex-col items-center justify-center`}>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Overall Score</p>
              <div className={`text-6xl font-bold ${getScoreColor(score)}`}>{score}</div>
              <p className="text-xs text-slate-500 mt-1">/10</p>
              <div className={`mt-3 text-xs px-3 py-1 rounded-full border font-medium ${getRecommendationStyle(data?.recommendation ?? '')}`}>
                {(data?.recommendation ?? 'pending').replace(/_/g, ' ').toUpperCase()}
              </div>
            </div>

            {/* Summary & Info */}
            <div className="md:col-span-2 bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <FiGitPullRequest className="w-4 h-4 text-indigo-400" />
                <span className="text-sm text-slate-400">PR #{data?.pr_number ?? ''}</span>
                <span className="text-xs text-slate-500 ml-auto">{data?.repository ?? ''}</span>
              </div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Summary</h4>
              <div className="text-sm text-slate-300">{renderMarkdown(data?.summary ?? '')}</div>
            </div>
          </div>

          {/* Quality Metrics */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><FiTrendingUp className="w-4 h-4 text-indigo-400" />Quality Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QualityBar label="Readability" value={metrics?.readability ?? 0} icon={<FiEye className="w-4 h-4 text-slate-400" />} />
              <QualityBar label="Maintainability" value={metrics?.maintainability ?? 0} icon={<FiSettings className="w-4 h-4 text-slate-400" />} />
              <QualityBar label="Performance" value={metrics?.performance ?? 0} icon={<FiZap className="w-4 h-4 text-slate-400" />} />
              <QualityBar label="Security" value={metrics?.security ?? 0} icon={<FiShield className="w-4 h-4 text-slate-400" />} />
            </div>
          </div>

          {/* Bugs Found */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><FiAlertTriangle className="w-4 h-4 text-orange-400" />Bugs Found <span className="text-xs bg-slate-700 rounded-full px-2 py-0.5 text-slate-400 ml-1">{bugs.length}</span></h3>
            {bugs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No bugs detected</p>
            ) : (
              <div className="space-y-3">
                {bugs.map((bug, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getSeverityColor(bug?.severity ?? '')}`}>{bug?.severity ?? 'unknown'}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1"><FiFileText className="w-3 h-3" />{bug?.file ?? ''}</span>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{bug?.description ?? ''}</p>
                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-md p-2.5">
                      <p className="text-xs text-indigo-300 flex items-start gap-1.5"><FiArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" /><span>{bug?.suggestion ?? ''}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Improvements */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><FiTrendingUp className="w-4 h-4 text-cyan-400" />Suggested Improvements <span className="text-xs bg-slate-700 rounded-full px-2 py-0.5 text-slate-400 ml-1">{improvements.length}</span></h3>
            {improvements.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No improvements suggested</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {improvements.map((imp, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">{imp?.category ?? ''}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(imp?.priority ?? '')}`}>{imp?.priority ?? ''}</span>
                    </div>
                    <p className="text-sm text-slate-300">{imp?.description ?? ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Best Practices */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><FiCheckCircle className="w-4 h-4 text-emerald-400" />Best Practices Checklist</h3>
            {practices.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No practices evaluated</p>
            ) : (
              <div className="space-y-2">
                {practices.map((bp, i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-900/30 rounded-lg p-3">
                    <div className="mt-0.5 flex-shrink-0">{getStatusIcon(bp?.status ?? '')}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200">{bp?.practice ?? ''}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{bp?.note ?? ''}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${(bp?.status ?? '').toLowerCase() === 'pass' ? 'bg-emerald-500/20 text-emerald-400' : (bp?.status ?? '').toLowerCase() === 'partial' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{bp?.status ?? ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// Tab: Progress & Reminders
// ============================================================================

function ProgressTab({
  owner, repo,
  progressResult, progressLoading, progressError, onCheckProgress,
  notionDbId, setNotionDbId,
  sampleMode,
  scheduleData, scheduleLogs, scheduleLoading, scheduleError,
  onToggleSchedule, onTriggerNow, onRefreshSchedule, scheduleActionMsg
}: {
  owner: string; repo: string
  progressResult: ProgressResult | null
  progressLoading: boolean; progressError: string | null
  onCheckProgress: () => void
  notionDbId: string; setNotionDbId: (v: string) => void
  sampleMode: boolean
  scheduleData: Schedule | null
  scheduleLogs: ExecutionLog[]
  scheduleLoading: boolean; scheduleError: string | null
  onToggleSchedule: () => void
  onTriggerNow: () => void
  onRefreshSchedule: () => void
  scheduleActionMsg: string | null
}) {
  const data = sampleMode ? SAMPLE_PROGRESS_DATA : progressResult
  const summary = data?.progress_summary
  const overdueItems = Array.isArray(data?.overdue_items) ? data.overdue_items : []
  const upcomingTasks = Array.isArray(data?.upcoming_tasks) ? data.upcoming_tasks : []
  const focusAreas = Array.isArray(data?.focus_areas) ? data.focus_areas : []
  const completionRate = summary?.completion_rate ?? 0
  const safeScheduleLogs = Array.isArray(scheduleLogs) ? scheduleLogs : []

  return (
    <div className="space-y-6">
      {/* Manual Trigger */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><FiTarget className="w-4 h-4 text-indigo-400" />Check Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Notion Database ID</label>
            <div className="relative">
              <FiBook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" value={notionDbId} onChange={(e) => setNotionDbId(e.target.value)} placeholder="e.g. abc123def456" className="w-full bg-slate-900/60 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors" />
            </div>
          </div>
          <div className="flex items-end">
            <button onClick={onCheckProgress} disabled={progressLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm">
              {progressLoading ? <><FiRefreshCw className="w-4 h-4 animate-spin" />Checking...</> : <><FiActivity className="w-4 h-4" />Check Progress</>}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {progressError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Progress Check Failed</p>
            <p className="text-xs text-red-400/70 mt-1">{progressError}</p>
          </div>
        </div>
      )}

      {/* No data */}
      {!data && !progressLoading && !progressError && (
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-12 text-center">
          <FiClock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No progress data yet. Click Check Progress to generate a progress report.</p>
        </div>
      )}

      {/* Loading */}
      {progressLoading && !data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(k => (
            <div key={k} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 animate-pulse">
              <div className="h-3 bg-slate-700 rounded mb-2 w-2/3" />
              <div className="h-8 bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {data && (
        <>
          {/* Report date & reminder status */}
          {data?.report_date && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FiCalendar className="w-3.5 h-3.5" />
              <span>Report Date: {data.report_date}</span>
              {data?.reminder_posted && <span className="ml-2 bg-emerald-500/20 text-emerald-400 rounded-full px-2 py-0.5 text-xs">Reminder Posted</span>}
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard icon={<FiCheckCircle className="w-5 h-5" />} label="Completed" value={summary?.tasks_completed ?? 0} color="text-emerald-400" />
            <MetricCard icon={<FiActivity className="w-5 h-5" />} label="In Progress" value={summary?.tasks_in_progress ?? 0} color="text-indigo-400" />
            <MetricCard icon={<FiAlertCircle className="w-5 h-5" />} label="Overdue" value={summary?.tasks_overdue ?? 0} color="text-red-400" />
            <MetricCard icon={<FiClock className="w-5 h-5" />} label="Upcoming" value={summary?.upcoming_deadlines ?? 0} color="text-yellow-400" />
            <MetricCard icon={<FiTrendingUp className="w-5 h-5" />} label="Completion" value={`${completionRate}%`} color="text-cyan-400" />
          </div>

          {/* Message */}
          {data?.message && (
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <FiMessageSquare className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-300">{renderMarkdown(data.message)}</div>
              </div>
            </div>
          )}

          {/* Overdue Items */}
          <div className="bg-slate-800/60 border border-red-500/20 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-red-400 mb-4 flex items-center gap-2"><FiAlertTriangle className="w-4 h-4" />Overdue Items <span className="text-xs bg-red-500/20 rounded-full px-2 py-0.5 ml-1">{overdueItems.length}</span></h3>
            {overdueItems.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No overdue items</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-2 text-xs text-slate-400 font-medium">Task</th>
                      <th className="text-left py-2 text-xs text-slate-400 font-medium">Due Date</th>
                      <th className="text-left py-2 text-xs text-slate-400 font-medium">Days Overdue</th>
                      <th className="text-left py-2 text-xs text-slate-400 font-medium">Assignee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueItems.map((item, i) => (
                      <tr key={i} className="border-b border-slate-700/30">
                        <td className="py-2.5 text-slate-200">{item?.title ?? ''}</td>
                        <td className="py-2.5 text-slate-400">{item?.due_date ?? ''}</td>
                        <td className="py-2.5"><span className="text-red-400 font-medium">{item?.days_overdue ?? 0} days</span></td>
                        <td className="py-2.5 text-slate-400">{item?.assignee ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-blue-400 mb-4 flex items-center gap-2"><FiClock className="w-4 h-4" />Upcoming Tasks <span className="text-xs bg-blue-500/20 rounded-full px-2 py-0.5 ml-1">{upcomingTasks.length}</span></h3>
            {upcomingTasks.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No upcoming tasks</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-2 text-xs text-slate-400 font-medium">Task</th>
                      <th className="text-left py-2 text-xs text-slate-400 font-medium">Due Date</th>
                      <th className="text-left py-2 text-xs text-slate-400 font-medium">Days Left</th>
                      <th className="text-left py-2 text-xs text-slate-400 font-medium">Assignee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingTasks.map((item, i) => (
                      <tr key={i} className="border-b border-slate-700/30">
                        <td className="py-2.5 text-slate-200">{item?.title ?? ''}</td>
                        <td className="py-2.5 text-slate-400">{item?.due_date ?? ''}</td>
                        <td className="py-2.5"><span className={(item?.days_remaining ?? 0) <= 2 ? 'text-yellow-400 font-medium' : 'text-blue-400 font-medium'}>{item?.days_remaining ?? 0} days</span></td>
                        <td className="py-2.5 text-slate-400">{item?.assignee ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Focus Areas */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><FiTarget className="w-4 h-4 text-indigo-400" />Focus Areas</h3>
            {focusAreas.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No focus areas identified</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {focusAreas.map((fa, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-200">{fa?.area ?? ''}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(fa?.priority ?? '')}`}>{fa?.priority ?? ''}</span>
                    </div>
                    <p className="text-xs text-slate-400">{fa?.reason ?? ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Schedule Management */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><FiCalendar className="w-4 h-4 text-indigo-400" />Daily Progress Schedule</h3>
          <button onClick={onRefreshSchedule} disabled={scheduleLoading} className="text-xs text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1">
            <FiRefreshCw className={`w-3.5 h-3.5 ${scheduleLoading ? 'animate-spin' : ''}`} />Refresh
          </button>
        </div>

        {scheduleError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center gap-2 text-xs text-red-400">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0" />{scheduleError}
          </div>
        )}

        {scheduleActionMsg && (
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3 mb-4 flex items-center gap-2 text-xs text-indigo-400">
            <FiCheckCircle className="w-4 h-4 flex-shrink-0" />{scheduleActionMsg}
          </div>
        )}

        {scheduleLoading && !scheduleData && (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-700 rounded w-1/3" />
            <div className="h-10 bg-slate-700 rounded" />
            <div className="h-4 bg-slate-700 rounded w-1/2" />
          </div>
        )}

        {scheduleData && (
          <div className="space-y-4">
            {/* Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${scheduleData.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span className={`text-sm font-medium ${scheduleData.is_active ? 'text-emerald-400' : 'text-slate-400'}`}>{scheduleData.is_active ? 'Active' : 'Paused'}</span>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Schedule</p>
                <p className="text-sm text-slate-200">{scheduleData.cron_expression ? cronToHuman(scheduleData.cron_expression) : 'N/A'}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Timezone</p>
                <p className="text-sm text-slate-200">{scheduleData.timezone ?? 'N/A'}</p>
              </div>
            </div>

            {/* Next / Last run */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Next Run</p>
                <p className="text-sm text-slate-200">{scheduleData.next_run_time ?? 'Not scheduled'}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Last Run</p>
                <p className="text-sm text-slate-200">{scheduleData.last_run_at ?? 'Never'}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button onClick={onToggleSchedule} disabled={scheduleLoading} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${scheduleData.is_active ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}`}>
                {scheduleData.is_active ? <><FiPause className="w-4 h-4" />Pause Schedule</> : <><FiPlay className="w-4 h-4" />Activate Schedule</>}
              </button>
              <button onClick={onTriggerNow} disabled={scheduleLoading} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 transition-all duration-200">
                <FiZap className="w-4 h-4" />Run Now
              </button>
            </div>
          </div>
        )}

        {!scheduleData && !scheduleLoading && (
          <p className="text-xs text-slate-500 text-center py-4">Schedule not found. It may not have been created yet.</p>
        )}

        {/* Execution History */}
        <div className="mt-6 pt-4 border-t border-slate-700/50">
          <h4 className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-2"><FiList className="w-3.5 h-3.5" />Execution History</h4>
          {safeScheduleLogs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No execution history yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-2 text-slate-400 font-medium">Executed At</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Status</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Attempt</th>
                  </tr>
                </thead>
                <tbody>
                  {safeScheduleLogs.map((log, i) => (
                    <tr key={log?.id ?? i} className="border-b border-slate-700/30">
                      <td className="py-2 text-slate-300">{log?.executed_at ?? 'N/A'}</td>
                      <td className="py-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${log?.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {log?.success ? <FiCheckCircle className="w-3 h-3" /> : <FiAlertCircle className="w-3 h-3" />}
                          {log?.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="py-2 text-slate-400">{log?.attempt ?? 0}/{log?.max_attempts ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function Page() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'codereview' | 'progress'>('dashboard')
  const [sampleMode, setSampleMode] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // Shared config
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('')

  // Dashboard state
  const [syncResult, setSyncResult] = useState<SyncManagerResult | null>(null)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  // Code Review state
  const [prNumber, setPrNumber] = useState('')
  const [reviewResult, setReviewResult] = useState<CodeReviewResult | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  // Progress state
  const [notionDbId, setNotionDbId] = useState('')
  const [progressResult, setProgressResult] = useState<ProgressResult | null>(null)
  const [progressLoading, setProgressLoading] = useState(false)
  const [progressError, setProgressError] = useState<string | null>(null)

  // Schedule state
  const [scheduleData, setScheduleData] = useState<Schedule | null>(null)
  const [scheduleLogs, setScheduleLogs] = useState<ExecutionLog[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [scheduleActionMsg, setScheduleActionMsg] = useState<string | null>(null)

  // Load schedule on mount
  const loadSchedules = useCallback(async () => {
    setScheduleLoading(true)
    setScheduleError(null)
    try {
      const result = await listSchedules()
      if (result.success) {
        const allSchedules = Array.isArray(result.schedules) ? result.schedules : []
        const found = allSchedules.find(s => s?.agent_id === AGENT_IDS.PROGRESS_REMINDER_AGENT) ?? null
        setScheduleData(found)
        if (found?.id) {
          const logsResult = await getScheduleLogs(found.id, { limit: 10 })
          if (logsResult.success && Array.isArray(logsResult.executions)) {
            setScheduleLogs(logsResult.executions)
          }
        }
      } else {
        setScheduleError(result.error ?? 'Failed to load schedules')
      }
    } catch (err) {
      setScheduleError('Failed to load schedule data')
    }
    setScheduleLoading(false)
  }, [])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  // Sync & Summarize
  const handleSync = useCallback(async () => {
    if (!owner || !repo) return
    setSyncLoading(true)
    setSyncError(null)
    setActiveAgentId(AGENT_IDS.PROJECT_SYNC_MANAGER)
    try {
      const result = await callAIAgent(
        `Sync and summarize the project for repository ${owner}/${repo}. Fetch all GitHub issues, PRs, and commit statuses, then sync them to Notion, and provide an organized task list with project summary.`,
        AGENT_IDS.PROJECT_SYNC_MANAGER
      )
      if (result.success) {
        const data = result?.response?.result
        setSyncResult(data as SyncManagerResult)
      } else {
        setSyncError(result?.error ?? result?.response?.message ?? 'Sync failed')
      }
    } catch (err) {
      setSyncError('Network error during sync')
    }
    setActiveAgentId(null)
    setSyncLoading(false)
  }, [owner, repo])

  // Code Review
  const handleReview = useCallback(async () => {
    if (!prNumber) return
    setReviewLoading(true)
    setReviewError(null)
    setActiveAgentId(AGENT_IDS.CODE_REVIEW_AGENT)
    try {
      const result = await callAIAgent(
        `Review the pull request #${prNumber} in repository ${owner || 'owner'}/${repo || 'repo'}. Analyze the code changes, evaluate quality, identify bugs, suggest improvements, and check best practices. Provide a detailed structured review.`,
        AGENT_IDS.CODE_REVIEW_AGENT
      )
      if (result.success) {
        const data = result?.response?.result
        setReviewResult(data as CodeReviewResult)
      } else {
        setReviewError(result?.error ?? result?.response?.message ?? 'Review failed')
      }
    } catch (err) {
      setReviewError('Network error during review')
    }
    setActiveAgentId(null)
    setReviewLoading(false)
  }, [prNumber, owner, repo])

  // Progress Check
  const handleCheckProgress = useCallback(async () => {
    setProgressLoading(true)
    setProgressError(null)
    setActiveAgentId(AGENT_IDS.PROGRESS_REMINDER_AGENT)
    try {
      const result = await callAIAgent(
        `Check project progress for Notion database ${notionDbId || 'default'} and GitHub repository ${owner || 'owner'}/${repo || 'repo'}. Compile progress metrics, identify overdue items, upcoming deadlines, and generate focus areas.`,
        AGENT_IDS.PROGRESS_REMINDER_AGENT
      )
      if (result.success) {
        const data = result?.response?.result
        setProgressResult(data as ProgressResult)
      } else {
        setProgressError(result?.error ?? result?.response?.message ?? 'Progress check failed')
      }
    } catch (err) {
      setProgressError('Network error during progress check')
    }
    setActiveAgentId(null)
    setProgressLoading(false)
  }, [notionDbId, owner, repo])

  // Schedule Toggle
  const handleToggleSchedule = useCallback(async () => {
    if (!scheduleData?.id) return
    setScheduleLoading(true)
    setScheduleError(null)
    setScheduleActionMsg(null)
    try {
      if (scheduleData.is_active) {
        const result = await pauseSchedule(scheduleData.id)
        if (result.success) {
          setScheduleActionMsg('Schedule paused successfully')
        } else {
          setScheduleError(result.error ?? 'Failed to pause schedule')
        }
      } else {
        const result = await resumeSchedule(scheduleData.id)
        if (result.success) {
          setScheduleActionMsg('Schedule activated successfully')
        } else {
          setScheduleError(result.error ?? 'Failed to activate schedule')
        }
      }
      await loadSchedules()
    } catch (err) {
      setScheduleError('Failed to toggle schedule')
    }
    setScheduleLoading(false)
  }, [scheduleData, loadSchedules])

  // Trigger Now
  const handleTriggerNow = useCallback(async () => {
    if (!scheduleData?.id) return
    setScheduleLoading(true)
    setScheduleError(null)
    setScheduleActionMsg(null)
    try {
      const result = await triggerScheduleNow(scheduleData.id)
      if (result.success) {
        setScheduleActionMsg('Schedule triggered. Execution will start shortly.')
      } else {
        setScheduleError(result.error ?? 'Failed to trigger schedule')
      }
      await loadSchedules()
    } catch (err) {
      setScheduleError('Failed to trigger schedule')
    }
    setScheduleLoading(false)
  }, [scheduleData, loadSchedules])

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: <FiActivity className="w-4 h-4" /> },
    { id: 'codereview' as const, label: 'Code Review', icon: <FiCode className="w-4 h-4" /> },
    { id: 'progress' as const, label: 'Progress', icon: <FiClock className="w-4 h-4" /> },
  ]

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-200">
        {/* Header */}
        <header className="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                  <FiGitMerge className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-white tracking-tight">ProjectSync</h1>
              </div>

              {/* Sample Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Sample Data</span>
                <button onClick={() => setSampleMode(!sampleMode)} className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${sampleMode ? 'bg-indigo-600' : 'bg-slate-700'}`} aria-label="Toggle sample data">
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200" style={{ transform: sampleMode ? 'translateX(20px)' : 'translateX(0)' }} />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex gap-0 -mb-px">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === tab.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'}`}>
                  {tab.icon}{tab.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {activeTab === 'dashboard' && (
            <DashboardTab
              owner={owner} setOwner={setOwner}
              repo={repo} setRepo={setRepo}
              syncResult={syncResult}
              syncLoading={syncLoading}
              syncError={syncError}
              onSync={handleSync}
              sampleMode={sampleMode}
            />
          )}

          {activeTab === 'codereview' && (
            <CodeReviewTab
              owner={owner} repo={repo}
              reviewResult={reviewResult}
              reviewLoading={reviewLoading}
              reviewError={reviewError}
              onReview={handleReview}
              prNumber={prNumber}
              setPrNumber={setPrNumber}
              sampleMode={sampleMode}
            />
          )}

          {activeTab === 'progress' && (
            <ProgressTab
              owner={owner} repo={repo}
              progressResult={progressResult}
              progressLoading={progressLoading}
              progressError={progressError}
              onCheckProgress={handleCheckProgress}
              notionDbId={notionDbId}
              setNotionDbId={setNotionDbId}
              sampleMode={sampleMode}
              scheduleData={scheduleData}
              scheduleLogs={scheduleLogs}
              scheduleLoading={scheduleLoading}
              scheduleError={scheduleError}
              onToggleSchedule={handleToggleSchedule}
              onTriggerNow={handleTriggerNow}
              onRefreshSchedule={loadSchedules}
              scheduleActionMsg={scheduleActionMsg}
            />
          )}

          {/* Agent Status Panel */}
          <AgentStatusPanel activeAgentId={activeAgentId} />
        </main>
      </div>
    </ErrorBoundary>
  )
}
