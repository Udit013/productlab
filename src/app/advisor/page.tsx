"use client"

import { useEffect, useRef, useState } from "react"
import { DashboardLayout } from "../dashboard-layout"
import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, Send, Sparkles, Cpu, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  role: 'user' | 'assistant'
  content: string
  source?: string
}

const SUGGESTED_QUESTIONS = [
  'What should we build next?',
  'Why is retention decreasing?',
  'Which experiment should we run next?',
  'What feature has the highest ROI?',
  'What roadmap changes should we make?',
  'What is the expected revenue impact of our top initiative?',
]

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser ? "bg-accent" : "bg-surface-2"
      )}>
        {isUser ? (
          <span className="text-accent-fg text-xs font-bold">You</span>
        ) : (
          <Bot className="h-4 w-4 text-muted" />
        )}
      </div>
      <div className={cn(
        "max-w-2xl rounded-xl px-4 py-3 text-sm",
        isUser
          ? "bg-accent text-accent-fg rounded-tr-none"
          : "bg-surface border border-line text-ink rounded-tl-none"
      )}>
        <pre className="whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</pre>
        {msg.source && (
          <p className={cn("text-[10px] mt-2 opacity-60", isUser ? 'text-accent-fg/70' : 'text-faint')}>
            {msg.source === 'ollama' ? '⚡ Powered by Ollama' : '🔧 Deterministic engine'}
          </p>
        )}
      </div>
    </div>
  )
}

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your ProductLab AI Advisor.

I've analyzed your product intelligence data including:
• Opportunity scores and business impact
• Experiment results and statistical significance
• Retention metrics and cohort trends
• Prioritization scores and ROI estimates

Ask me anything about your product strategy. Try one of the suggested questions below, or ask your own.`,
      source: 'deterministic',
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [useAI, setUseAI] = useState(false)
  const [ollamaAvailable, setOllamaAvailable] = useState(false)
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState('llama3.2')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/advisor').then(r => r.json()).then(d => {
      setOllamaAvailable(d.available)
      if (d.models?.length > 0) {
        setOllamaModels(d.models)
        setSelectedModel(d.models[0])
      }
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(question?: string) {
    const q = question ?? input.trim()
    if (!q) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, model: selectedModel, useAI }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        source: data.source,
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        source: 'error',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <Topbar title="AI Product Advisor" subtitle="Strategy questions · Recommendations · Trade-off analysis" />
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Chat */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-muted" />
                </div>
                <div className="bg-surface border border-line rounded-xl rounded-tl-none px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-line-2 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-line p-4 bg-surface">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask about your product strategy..."
                className="flex-1 border border-line rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <Button onClick={() => send()} disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 border-l border-line bg-surface flex flex-col">
          <div className="p-4 border-b border-line">
            <p className="text-xs font-semibold text-ink-2 uppercase tracking-wide mb-3">Suggested Questions</p>
            <div className="space-y-1">
              {SUGGESTED_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-muted hover:bg-surface-2 hover:text-ink flex items-center gap-2 group transition-colors"
                >
                  <ChevronRight className="h-3 w-3 text-accent flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            <p className="text-xs font-semibold text-ink-2 uppercase tracking-wide mb-3">AI Settings</p>

            {/* Ollama toggle */}
            <div className={cn(
              "rounded-lg p-3 border",
              ollamaAvailable ? "border-emerald-500/30 bg-emerald-500/15" : "border-line bg-surface-2"
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className={cn("h-4 w-4", ollamaAvailable ? "text-emerald-600" : "text-faint")} />
                  <span className="text-xs font-medium text-ink-2">Ollama LLM</span>
                </div>
                <div className={cn("w-2 h-2 rounded-full", ollamaAvailable ? "bg-emerald-500" : "bg-line-2")} />
              </div>
              <p className="text-[10px] text-muted">
                {ollamaAvailable
                  ? `${ollamaModels.length} model(s) available`
                  : 'Not connected. Running in deterministic mode.'}
              </p>
              {ollamaAvailable && (
                <>
                  <select
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    className="mt-2 w-full text-xs border border-line rounded px-2 py-1"
                  >
                    {ollamaModels.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAI}
                      onChange={e => setUseAI(e.target.checked)}
                      className="rounded border-line-2"
                    />
                    <span className="text-xs text-muted">Use Ollama for responses</span>
                  </label>
                </>
              )}
            </div>

            <div className="mt-3 rounded-lg p-3 border border-accent/25 bg-accent/10">
              <p className="text-[10px] font-semibold text-accent mb-1">Deterministic Mode</p>
              <p className="text-[10px] text-accent">
                All answers are powered by structured product intelligence data — no hallucinations, no external calls.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
