import { ChangeEvent, useMemo, useRef, useState } from 'react'
import {
  Activity,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  Filter,
  FolderOpen,
  HardDrive,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'

type Source = {
  id: string
  name: string
  kind: 'PDF' | 'DOC' | 'MD'
  updated: string
  pages: number
  content: string
  status: 'ready' | 'processing'
}
type Answer = { question: string; text: string; refs: string[] }
const seed: Source[] = [
  {
    id: 'launch',
    name: 'Q3 Launch Brief.pdf',
    kind: 'PDF',
    updated: '今天 10:42',
    pages: 18,
    status: 'ready',
    content:
      'Q3 产品发布计划：7 月邀请制试用，招募 30 个远程团队；8 月发布会议模板与用户案例；9 月公开发布。北极星指标是每周完成至少 3 场 AI 总结会议的活跃团队数。',
  },
  {
    id: 'voice',
    name: 'Product Voice & Tone.docx',
    kind: 'DOC',
    updated: '今天 09:18',
    pages: 12,
    status: 'ready',
    content:
      '品牌语调清晰、友好、务实。避免夸大 AI 能力，说明信息来源。用主动语态和具体动词，标题简短，不使用生硬的技术术语。',
  },
  {
    id: 'interviews',
    name: 'User Interviews — May.pdf',
    kind: 'PDF',
    updated: '昨天 16:30',
    pages: 36,
    status: 'ready',
    content:
      '用户访谈发现：团队需要自动提取会议决策和待办。受访者担心隐私及错误总结。最有价值的时刻是会后快速确认负责人和下一步。',
  },
  {
    id: 'onboarding',
    name: 'Onboarding Experiments.md',
    kind: 'MD',
    updated: '昨天 14:05',
    pages: 7,
    status: 'ready',
    content:
      '新手引导实验：让用户用示例会议在 30 秒内获得第一个 AI 总结。观察首次会话完成率、7 日回访率和邀请同事比例。',
  },
  {
    id: 'pricing',
    name: 'Pricing Research.pdf',
    kind: 'PDF',
    updated: '10月12日',
    pages: 24,
    status: 'ready',
    content:
      'AI 笔记工具常见定价模式包括免费增值、按席位订阅和用量分层。转录时长和团队协作是清晰的升级边界。',
  },
]
const suggestions = [
  'Q3 发布的核心指标是什么？',
  '用户最关注哪些问题？',
  '如何改进新手引导？',
]
function answerQuestion(question: string, sources: Source[]): Answer {
  const terms = question
    .toLowerCase()
    .split(/[\s，。？?、]+/)
    .filter((term) => term.length > 1)
  const refs = sources
    .map((source) => ({
      source,
      score: terms.filter((term) =>
        (source.name + source.content).toLowerCase().includes(term),
      ).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => item.source)
  let text =
    '我在当前知识库中找到一些相关资料。可以继续追问具体细节，我会优先根据下方引用回答。'
  if (/指标|发布|q3/i.test(question))
    text =
      'Q3 发布的北极星指标是**每周完成至少 3 场 AI 总结会议的活跃团队数**。计划分为三个阶段：7 月邀请 30 个团队试用，8 月用模板和案例验证增长，9 月开放自助注册。'
  else if (/用户|担心|问题|关注/.test(question))
    text =
      '访谈中反复出现两类重点：团队希望会后快速确认**会议决策、负责人和下一步**；同时会关注隐私保护和总结准确性。沟通时应清楚说明信息来源，避免夸大 AI 能力。'
  else if (/引导|新手|30 秒/.test(question))
    text =
      '资料建议让用户用示例会议在 **30 秒内获得第一个 AI 总结**，并观察首次会话完成率、7 日回访率和邀请同事比例。'
  else if (/语调|文案|改写/.test(question))
    text =
      '品牌语调应该清晰、友好、务实。建议用主动语态和具体动词，说明 AI 做了什么、依据什么信息，避免承诺无法保证的结果。'
  return { question, text, refs: refs.map((source) => source.id) }
}
function RichText({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(\*\*.*?\*\*)/g)
        .map((part, i) =>
          part.startsWith('**') ? (
            <strong key={i}>{part.slice(2, -2)}</strong>
          ) : (
            part
          ),
        )}
    </>
  )
}
export default function App() {
  const [sources, setSources] = useState(seed)
  const [selected, setSelected] = useState('launch')
  const [filter, setFilter] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [citation, setCitation] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const shown = useMemo(
    () =>
      sources.filter((source) =>
        source.name.toLowerCase().includes(filter.toLowerCase()),
      ),
    [sources, filter],
  )
  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }
  function ask(value = question) {
    if (!value.trim()) return
    setAnswer(answerQuestion(value.trim(), sources))
    setQuestion('')
  }
  async function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])]
    for (const file of files) {
      const text =
        file.size < 1_000_000 ? await file.text().catch(() => '') : ''
      const kind =
        file.name.endsWith('.md') || file.name.endsWith('.txt')
          ? 'MD'
          : file.name.endsWith('.docx')
            ? 'DOC'
            : 'PDF'
      const source: Source = {
        id: crypto.randomUUID(),
        name: file.name,
        kind,
        updated: '刚刚',
        pages: Math.max(1, Math.round(file.size / 3000)),
        status: 'processing',
        content: text || '文件已添加。演示版目前只读取 TXT 和 Markdown 文本。',
      }
      setSources((current) => [source, ...current])
      setSelected(source.id)
      window.setTimeout(
        () =>
          setSources((current) =>
            current.map((item) =>
              item.id === source.id ? { ...item, status: 'ready' } : item,
            ),
          ),
        900,
      )
    }
    if (files.length) notify(files.length + ' 个文件已加入知识库')
    event.target.value = ''
  }
  const selectedSource = sources.find((source) => source.id === selected)
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Activity size={17} />
          </span>
          <b>
            atlas<span>.</span>
          </b>
          <button aria-label="折叠导航">
            <ArrowRight size={15} />
          </button>
        </div>
        <button className="workspace">
          <span className="workspace-avatar">N</span>
          <span>
            <b>Northstar Studio</b>
            <small>团队工作区</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <div className="side-label">工作区</div>
        <button className="nav-item active">
          <BookOpen size={16} />
          知识库<span className="count">{sources.length}</span>
        </button>
        <button className="nav-item" onClick={() => notify('收藏夹即将推出')}>
          <FolderOpen size={16} />
          收藏夹
        </button>
        <button className="nav-item" onClick={() => notify('最近查看即将推出')}>
          <Clock3 size={16} />
          最近查看
        </button>
        <div className="side-rule" />
        <div className="side-label">
          你的空间
          <button
            aria-label="新增空间"
            onClick={() => notify('空间管理即将推出')}
          >
            <Plus size={14} />
          </button>
        </div>
        <button className="space selected">
          <i className="violet" />
          Product Handbook
        </button>
        <button className="space">
          <i className="green" />
          Design System
        </button>
        <button className="space">
          <i className="amber" />
          Customer Research
        </button>
        <div className="side-bottom">
          <div className="storage">
            <span>存储空间</span>
            <b>
              2.4 GB <small>/ 10 GB</small>
            </b>
            <div>
              <i />
            </div>
          </div>
          <button className="profile">
            <span>J</span>
            <b>
              Jamie Chen<small>Free plan</small>
            </b>
            <MoreHorizontal size={16} />
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <span>知识库</span>
            <i>/</i>
            <b>Product Handbook</b>
          </div>
          <div className="top-actions">
            <button
              className="search-all"
              onClick={() => document.getElementById('source-search')?.focus()}
            >
              <Search size={14} />
              搜索知识库 <kbd>⌘ K</kbd>
            </button>
            <button
              aria-label="帮助"
              onClick={() => notify('Atlas 知识库 · 演示模式')}
            >
              <CircleHelp size={17} />
            </button>
            <span className="top-avatar">J</span>
          </div>
        </header>
        <div className="content">
          <section className="page-head">
            <div>
              <div className="eyebrow">
                <i />
                TEAM KNOWLEDGE SPACE
              </div>
              <h1>Product Handbook</h1>
              <p>让产品知识变得易查、可信、可行动。</p>
            </div>
            <div className="head-actions">
              <button onClick={() => notify('这是一个私有演示空间')}>
                <ShieldCheck size={14} />
                私有空间
                <ChevronDown size={12} />
              </button>
              <button className="add" onClick={() => fileRef.current?.click()}>
                <Plus size={15} />
                添加资料
              </button>
              <input
                ref={fileRef}
                type="file"
                hidden
                multiple
                accept=".txt,.md,.pdf,.doc,.docx"
                onChange={addFiles}
              />
            </div>
          </section>
          <div className="stats">
            <div>
              <span className="stat-icon lavender">
                <FileText size={15} />
              </span>
              <span>
                <b>{sources.length + 9}</b>
                <small>个来源</small>
              </span>
            </div>
            <i />
            <div>
              <span className="stat-icon mint">
                <Activity size={15} />
              </span>
              <span>
                <b>全部已索引</b>
                <small>最新同步 今天 10:42</small>
              </span>
            </div>
            <i />
            <div>
              <span className="stat-icon sand">
                <HardDrive size={15} />
              </span>
              <span>
                <b>2.4 GB</b>
                <small>已使用空间</small>
              </span>
            </div>
            <div className="private">
              <ShieldCheck size={13} />
              仅团队成员可访问
            </div>
          </div>
          <div className="panels">
            <section className="sources panel">
              <div className="panel-head">
                <div>
                  <h2>
                    来源资料 <span>{sources.length}</span>
                  </h2>
                  <p>管理和查看知识库中的内容</p>
                </div>
                <button
                  aria-label="来源选项"
                  onClick={() => notify('来源设置即将推出')}
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>
              <div className="source-tools">
                <label>
                  <Search size={14} />
                  <input
                    id="source-search"
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    placeholder="搜索文件…"
                  />
                </label>
                <button
                  aria-label="筛选"
                  onClick={() => notify('当前显示全部类型')}
                >
                  <Filter size={14} />
                </button>
                <button onClick={() => notify('按最近更新排序')}>
                  最近更新
                  <ChevronDown size={12} />
                </button>
              </div>
              <div className="source-list">
                {shown.map((source) => (
                  <button
                    className={
                      'source-row ' + (selected === source.id ? 'picked' : '')
                    }
                    key={source.id}
                    onClick={() => setSelected(source.id)}
                  >
                    <span className={'file-icon ' + source.kind.toLowerCase()}>
                      {source.kind}
                    </span>
                    <span className="file-details">
                      <b>{source.name}</b>
                      <small>
                        {source.updated}　·　{source.pages} 页
                      </small>
                    </span>
                    <span className={'index-status ' + source.status}>
                      {source.status === 'ready' ? (
                        <>
                          <Check size={12} />
                          已索引
                        </>
                      ) : (
                        <>
                          <span className="spinner" />
                          处理中
                        </>
                      )}
                    </span>
                    <MoreHorizontal size={14} className="row-more" />
                  </button>
                ))}
                {!shown.length && (
                  <div className="empty-list">没有匹配的文件</div>
                )}
              </div>
              <div className="source-footer">
                <span>
                  <i />
                  所有来源已同步
                </span>
                <button onClick={() => setFilter('')}>
                  查看全部来源
                  <ArrowRight size={12} />
                </button>
              </div>
            </section>
            <section className="assistant panel">
              <div className="assistant-head">
                <span>
                  <Sparkles size={16} />
                </span>
                <div>
                  <b>Ask your knowledge</b>
                  <small>基于已验证来源的 AI 回答</small>
                </div>
                <button
                  aria-label="助手设置"
                  onClick={() => notify('回答设置即将推出')}
                >
                  <MoreHorizontal size={17} />
                </button>
              </div>
              <div className="answer-area">
                {answer ? (
                  <div className="answer-thread">
                    <div className="question">{answer.question}</div>
                    <div className="answer-by">
                      <span>
                        <Sparkles size={12} />
                      </span>
                      <b>Atlas Assistant</b>
                      <i>·</i>
                      <small>已检索 {answer.refs.length} 个来源</small>
                    </div>
                    <p className="answer-copy">
                      <RichText text={answer.text} />
                    </p>
                    <div className="citations">
                      <span>来源</span>
                      {answer.refs.map((id, i) => {
                        const source = sources.find((item) => item.id === id)
                        return (
                          source && (
                            <button
                              key={id}
                              onClick={() => {
                                setCitation(citation === id ? null : id)
                                setSelected(id)
                              }}
                            >
                              <b>[{i + 1}]</b>
                              {source.name}
                              <ArrowUp size={10} />
                            </button>
                          )
                        )
                      })}
                    </div>
                    {citation && selectedSource && (
                      <div className="citation-preview">
                        <div>
                          <FileText size={13} />
                          {selectedSource.name}
                          <button
                            aria-label="关闭引用预览"
                            onClick={() => setCitation(null)}
                          >
                            <X size={13} />
                          </button>
                        </div>
                        <p>{selectedSource.content}</p>
                      </div>
                    )}
                    <div className="feedback">
                      <button onClick={() => notify('感谢反馈')}>
                        <Check size={12} />
                        有帮助
                      </button>
                      <button onClick={() => notify('反馈已记录')}>
                        需要改进
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="empty-answer">
                    <div className="orbit">
                      <span>
                        <Sparkles size={19} />
                      </span>
                      <i />
                      <b />
                    </div>
                    <strong>让知识库为你解答</strong>
                    <p>
                      提出一个问题，Atlas 会搜索来源，
                      <br />
                      并标出答案来自哪里。
                    </p>
                  </div>
                )}
              </div>
              <div className="prompts">
                {suggestions.map((prompt) => (
                  <button key={prompt} onClick={() => ask(prompt)}>
                    {prompt}
                    <ArrowRight size={11} />
                  </button>
                ))}
              </div>
              <div className="ask-box">
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      ask()
                    }
                  }}
                  placeholder="向你的知识库提问…"
                  rows={1}
                />
                <div>
                  <span>
                    <ShieldCheck size={12} />
                    仅搜索此知识库
                    <ChevronDown size={11} />
                  </span>
                  <button
                    disabled={!question.trim()}
                    aria-label="发送问题"
                    onClick={() => ask()}
                  >
                    <ArrowUp size={15} />
                  </button>
                </div>
              </div>
              <div className="privacy">
                <ShieldCheck size={12} />
                你的资料仅供当前工作区检索，不会用于训练模型。
              </div>
            </section>
          </div>
          <footer>
            Atlas Knowledge Base <i>·</i> Demo workspace{' '}
            <button onClick={() => notify('了解 Atlas 即将推出')}>
              了解 Atlas
              <ArrowRight size={11} />
            </button>
          </footer>
        </div>
      </main>
      {toast && (
        <div className="toast">
          <Check size={14} />
          {toast}
        </div>
      )}
    </div>
  )
}
