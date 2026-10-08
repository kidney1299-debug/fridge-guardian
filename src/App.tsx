import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { recipes } from './data'
import { useFoodStorage } from './hooks/useFoodStorage'
import {
  addDays,
  categoryEmoji,
  categoryLabels,
  daysUntil,
  expiryLabel,
  expiryTone,
  filterItems,
  getWasteStats,
  recommendRecipes,
  statusLabels,
  toDateString,
} from './lib/food'
import { clearShareHash, createShareUrl, readItemsFromHash } from './lib/share'
import type { AppTab, FoodItem, FoodStatus, StorageCategory } from './types'

const navItems: { id: AppTab; label: string; icon: string }[] = [
  { id: 'home', label: '홈', icon: '⌂' },
  { id: 'inventory', label: '식재료', icon: '▦' },
  { id: 'recipes', label: '요리 추천', icon: '♨' },
  { id: 'stats', label: '낭비 통계', icon: '↗' },
]

function Nav({ tab, onChange }: { tab: AppTab; onChange: (tab: AppTab) => void }) {
  return (
    <nav className="nav" aria-label="주 메뉴">
      {navItems.map((item) => (
        <button key={item.id} className={tab === item.id ? 'nav-item active' : 'nav-item'} onClick={() => onChange(item.id)}>
          <span className="nav-icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  )
}

function FoodCard({ item, onFinish }: { item: FoodItem; onFinish: (id: string, status: 'used' | 'discarded') => void }) {
  const tone = expiryTone(item.expiryDate)
  return (
    <article className={`food-card ${item.status !== 'active' ? 'completed' : ''}`}>
      <div className={`food-emoji ${item.category}`} aria-hidden="true">{item.emoji}</div>
      <div className="food-info">
        <div className="food-heading">
          <h3>{item.name}</h3>
          {item.status === 'active' ? (
            <span className={`expiry ${tone}`}>{expiryLabel(item.expiryDate)}</span>
          ) : (
            <span className={`status ${item.status}`}>{statusLabels[item.status]}</span>
          )}
        </div>
        <p>
          <span>{categoryLabels[item.category]}</span>
          <i>·</i>
          <span>{item.quantity}{item.unit}</span>
          {item.status === 'active' && <><i>·</i><span>{item.expiryDate.replaceAll('-', '.')}</span></>}
        </p>
        {item.status === 'active' && (
          <div className="food-actions">
            <button className="text-button success" onClick={() => onFinish(item.id, 'used')} aria-label={`${item.name} 사용 완료`}>✓ 사용했어요</button>
            <button className="text-button waste" onClick={() => onFinish(item.id, 'discarded')} aria-label={`${item.name} 폐기`}>폐기하기</button>
          </div>
        )}
      </div>
    </article>
  )
}

function Home({ items, onAdd, onShare, onNavigate, onFinish }: { items: FoodItem[]; onAdd: () => void; onShare: () => void; onNavigate: (tab: AppTab) => void; onFinish: (id: string, status: 'used' | 'discarded') => void }) {
  const active = items.filter((item) => item.status === 'active')
  const urgent = active.filter((item) => daysUntil(item.expiryDate) <= 3).sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
  const categories = (['fridge', 'freezer', 'room'] as StorageCategory[]).map((category) => ({ category, count: active.filter((item) => item.category === category).length }))

  return (
    <>
      <PageTitle eyebrow="오늘도 알뜰하게" title="안녕하세요, 파수꾼님!" description="냉장고 속 재료를 함께 살펴볼까요?" action={<div className="title-actions"><button className="share-icon-button" onClick={onShare} aria-label="가족에게 냉장고 공유">↗</button><button className="avatar" aria-label="내 프로필">파</button></div>} />
      <section className="hero-card">
        <div className="hero-copy">
          <span className="hero-badge">오늘의 알림</span>
          <h2>{urgent.length ? <><strong>{urgent.length}개</strong> 재료를<br />먼저 챙겨주세요</> : <>모든 재료가<br /><strong>싱싱해요!</strong></>}</h2>
          <p>{urgent.length ? `${urgent[0].name}${urgent.length > 1 ? ` 외 ${urgent.length - 1}개` : ''}의 기한이 가까워요.` : '꼼꼼한 관리, 정말 멋져요.'}</p>
          <button className="hero-button" onClick={() => onNavigate('inventory')}>지금 확인하기 <span>→</span></button>
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <span className="spark one">✦</span><span className="spark two">✦</span>
          <div className="mini-fridge"><span>🥬</span><span>🥛</span><span>🥚</span><span>🥕</span></div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">MY FRIDGE</p><h2>우리 집 보관함</h2></div><button className="link-button" onClick={() => onNavigate('inventory')}>전체보기 →</button></div>
        <div className="storage-grid">
          {categories.map(({ category, count }) => (
            <button className={`storage-card ${category}`} key={category} onClick={() => onNavigate('inventory')}>
              <span className="storage-icon">{categoryEmoji[category]}</span>
              <span><b>{categoryLabels[category]}</b><small>{count}개 보관 중</small></span>
            </button>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow coral">USE ME FIRST</p><h2>먼저 먹어주세요</h2></div>{urgent.length > 2 && <button className="link-button" onClick={() => onNavigate('inventory')}>더보기 →</button>}</div>
        {urgent.length ? <div className="food-list">{urgent.slice(0, 2).map((item) => <FoodCard item={item} onFinish={onFinish} key={item.id} />)}</div> : <EmptyState emoji="🌱" title="임박한 재료가 없어요" description="아주 알뜰하게 관리하고 계시네요!" />}
      </section>
      <button className="fab" onClick={onAdd}><span>＋</span> 식재료 등록</button>
    </>
  )
}

function Inventory({ items, onAdd, onShare, onFinish }: { items: FoodItem[]; onAdd: () => void; onShare: () => void; onFinish: (id: string, status: 'used' | 'discarded') => void }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<StorageCategory | 'all'>('all')
  const [status, setStatus] = useState<FoodStatus | 'all'>('active')
  const visible = useMemo(() => filterItems(items, search, category, status), [items, search, category, status])

  return (
    <>
      <PageTitle eyebrow="PANTRY" title="내 식재료" description="기한이 가까운 순서로 정리했어요." action={<div className="title-actions"><button className="share-button" onClick={onShare}><span>↗</span> 가족에게 공유</button><button className="primary-button desktop-add" onClick={onAdd}>＋ 식재료 등록</button></div>} />
      <section className="filter-panel" aria-label="식재료 검색 및 필터">
        <label className="search-box"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="식재료 이름을 검색해요" aria-label="식재료 검색" />{search && <button onClick={() => setSearch('')} aria-label="검색어 지우기">×</button>}</label>
        <div className="filter-row">
          <div className="chip-group" aria-label="보관 방법 필터">
            {(['all', 'fridge', 'freezer', 'room'] as const).map((value) => <button key={value} className={category === value ? 'chip active' : 'chip'} onClick={() => setCategory(value)}>{value === 'all' ? '전체' : categoryLabels[value]}</button>)}
          </div>
          <label className="select-wrap"><span className="sr-only">처리 상태</span><select value={status} onChange={(event) => setStatus(event.target.value as FoodStatus | 'all')}><option value="active">보관 중</option><option value="used">사용 완료</option><option value="discarded">폐기</option><option value="all">모든 기록</option></select></label>
        </div>
      </section>
      <div className="result-summary"><b>{visible.length}개</b><span>{status === 'active' ? '기한 임박 순' : '최근 처리 순'}</span></div>
      {visible.length ? <div className="food-list inventory-list">{visible.map((item) => <FoodCard item={item} onFinish={onFinish} key={item.id} />)}</div> : <EmptyState emoji="🔎" title="찾는 식재료가 없어요" description="검색어나 필터를 바꿔보세요." />}
      <button className="fab mobile-only" onClick={onAdd}><span>＋</span> 식재료 등록</button>
    </>
  )
}

function Recipes({ items }: { items: FoodItem[] }) {
  const recommended = recommendRecipes(items, recipes)
  return (
    <>
      <PageTitle eyebrow="COOK SMART" title="오늘 뭐 먹지?" description="지금 가진 재료로 만들기 쉬운 순서예요." />
      <div className="recipe-callout"><span>💡</span><p><b>파수꾼의 추천</b><br />보유 재료가 많이 겹치는 요리를 위로 올렸어요.</p></div>
      <div className="recipe-grid">
        {recommended.map((recipe, index) => (
          <article className="recipe-card" key={recipe.id}>
            <div className={`recipe-visual visual-${(index % 4) + 1}`}><span>{recipe.emoji}</span>{index === 0 && <b>가장 잘 맞아요</b>}</div>
            <div className="recipe-content">
              <div className="recipe-title"><div><h2>{recipe.name}</h2><p>{recipe.description}</p></div><span>⏱ {recipe.minutes}분</span></div>
              <div className="match-line"><b>{recipe.matched.length}/{recipe.ingredients.length} 재료 보유</b><span><i style={{ width: `${recipe.score * 100}%` }} /></span></div>
              <div className="ingredient-tags">{recipe.ingredients.map((ingredient) => <span className={recipe.matched.includes(ingredient) ? 'have' : 'missing'} key={ingredient}>{recipe.matched.includes(ingredient) ? '✓' : '＋'} {ingredient}</span>)}</div>
              <p className="recipe-tip">{recipe.tip}</p>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function Stats({ items, onReset }: { items: FoodItem[]; onReset: () => void }) {
  const stats = getWasteStats(items)
  const active = items.filter((item) => item.status === 'active')
  const expiring = active.filter((item) => daysUntil(item.expiryDate) <= 7).length
  return (
    <>
      <PageTitle eyebrow="LESS WASTE" title="낭비 리포트" description="작은 실천이 쌓인 기록을 확인해요." />
      <section className="score-card">
        <div className="score-ring" style={{ '--score': `${stats.saveRate * 3.6}deg` } as CSSProperties}><div><strong>{stats.saveRate}</strong><span>점</span></div></div>
        <div><span className="hero-badge">알뜰 지수</span><h2>{stats.saveRate >= 70 ? '멋진 습관이에요!' : '조금씩 줄여봐요!'}</h2><p>처리한 재료 {stats.total}개 중 {stats.used}개를 알뜰하게 사용했어요.</p></div>
      </section>
      <div className="stat-grid">
        <article className="stat-card green"><span>✓</span><p>사용 완료</p><strong>{stats.used}<small>개</small></strong></article>
        <article className="stat-card coral"><span>↘</span><p>폐기한 재료</p><strong>{stats.discarded}<small>개</small></strong></article>
        <article className="stat-card yellow"><span>!</span><p>7일 내 임박</p><strong>{expiring}<small>개</small></strong></article>
      </div>
      <section className="insight-card">
        <div className="section-heading"><div><p className="eyebrow">MY PROGRESS</p><h2>재료 활용 현황</h2></div><b>{stats.wasteRate}% 낭비</b></div>
        <div className="big-bar"><span className="used-bar" style={{ width: `${stats.saveRate}%` }} /><span className="waste-bar" style={{ width: `${stats.wasteRate}%` }} /></div>
        <div className="legend"><span><i className="used-dot" />사용 완료 {stats.saveRate}%</span><span><i className="waste-dot" />폐기 {stats.wasteRate}%</span></div>
        <p className="insight-message">🌿 {stats.discarded === 0 ? '완벽해요! 버린 재료가 하나도 없어요.' : `다음에는 임박 재료 ${Math.min(expiring, 2)}개부터 요리해 보면 어때요?`}</p>
      </section>
      <section className="data-card"><div><h3>샘플 데이터 다시 채우기</h3><p>체험용 초기 상태로 되돌립니다.</p></div><button className="secondary-button" onClick={onReset}>초기화</button></section>
    </>
  )
}

function EmptyState({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return <div className="empty-state"><span>{emoji}</span><h3>{title}</h3><p>{description}</p></div>
}

function AddFoodModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (item: Omit<FoodItem, 'id' | 'addedAt' | 'status'>) => void }) {
  const [category, setCategory] = useState<StorageCategory>('fridge')
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🥬')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('개')
  const [expiryDate, setExpiryDate] = useState(toDateString(addDays(new Date(), 7)))

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), emoji, category, quantity, unit: unit.trim() || '개', expiryDate })
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="add-title">
        <div className="modal-handle" />
        <header><div><p className="eyebrow">NEW ITEM</p><h2 id="add-title">새 식재료 등록</h2></div><button className="close-button" onClick={onClose} aria-label="닫기">×</button></header>
        <form onSubmit={submit}>
          <div className="field-grid name-field">
            <label><span>이름</span><input autoFocus required value={name} onChange={(event) => setName(event.target.value)} placeholder="예: 토마토" /></label>
            <label><span>아이콘</span><select value={emoji} onChange={(event) => setEmoji(event.target.value)}><option>🥬</option><option>🥕</option><option>🍅</option><option>🍎</option><option>🥛</option><option>🥚</option><option>🍖</option><option>🐟</option><option>🧀</option><option>🍞</option></select></label>
          </div>
          <fieldset><legend>보관 방법</legend><div className="category-picker">{(['fridge', 'freezer', 'room'] as StorageCategory[]).map((value) => <button type="button" key={value} className={category === value ? `active ${value}` : value} onClick={() => setCategory(value)}><span>{categoryEmoji[value]}</span>{categoryLabels[value]}</button>)}</div></fieldset>
          <div className="field-grid">
            <label><span>수량</span><input type="number" required min="0.1" step="0.1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></label>
            <label><span>단위</span><input required value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="개, 봉, 팩" /></label>
          </div>
          <label><span>유통기한</span><input type="date" required value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} /></label>
          <button className="submit-button" type="submit">파수꾼에게 맡기기</button>
        </form>
      </section>
    </div>
  )
}

function ImportModal({ items, onClose, onMerge }: { items: FoodItem[]; onClose: () => void; onMerge: () => void }) {
  const counts = (['fridge', 'freezer', 'room'] as StorageCategory[]).map((category) => ({
    category,
    count: items.filter((item) => item.category === category).length,
  }))
  return (
    <div className="modal-backdrop">
      <section className="modal import-modal" role="dialog" aria-modal="true" aria-labelledby="import-title">
        <div className="modal-handle" />
        <header><div><p className="eyebrow">FAMILY SHARE</p><h2 id="import-title">가족의 냉장고가 도착했어요</h2></div><button className="close-button" onClick={onClose} aria-label="공유 목록 닫기">×</button></header>
        <div className="import-hero"><span>🫶</span><div><strong>{items.length}개 식재료</strong><p>내 목록은 그대로 두고, 새로운 재료만 더할게요.</p></div></div>
        <div className="import-summary">
          {counts.map(({ category, count }) => <div key={category}><span>{categoryEmoji[category]}</span><b>{categoryLabels[category]}</b><small>{count}개</small></div>)}
        </div>
        <div className="import-preview">
          <p>가져올 목록</p>
          {items.slice(0, 4).map((item) => <div key={item.id}><span>{item.emoji}</span><b>{item.name}</b><small>{item.quantity}{item.unit} · {expiryLabel(item.expiryDate)}</small></div>)}
          {items.length > 4 && <p className="more-items">외 {items.length - 4}개</p>}
        </div>
        <div className="import-note"><span>✓</span><p>이미 있는 동일한 재료는 자동으로 건너뛰어요.<br />사용·폐기 기록은 공유되지 않아요.</p></div>
        <button className="submit-button merge-button" onClick={onMerge}>{items.length}개 목록 병합하기</button>
      </section>
    </div>
  )
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }
  const input = document.createElement('textarea')
  input.value = value
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  input.remove()
}

export default function App() {
  const [tab, setTab] = useState<AppTab>('home')
  const [showAdd, setShowAdd] = useState(false)
  const [incomingItems, setIncomingItems] = useState<FoodItem[] | null>(null)
  const [toast, setToast] = useState('')
  const { items, addItem, finishItem, mergeItems, resetSamples } = useFoodStorage()

  useEffect(() => {
    const receiveShare = () => {
      try {
        const incoming = readItemsFromHash()
        if (incoming) setIncomingItems(incoming)
      } catch (error) {
        setToast(error instanceof Error ? error.message : '공유 링크를 읽을 수 없어요.')
      } finally {
        clearShareHash()
      }
    }
    receiveShare()
    window.addEventListener('hashchange', receiveShare)
    return () => window.removeEventListener('hashchange', receiveShare)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  const finish = (id: string, status: 'used' | 'discarded') => {
    finishItem(id, status)
    setToast(status === 'used' ? '알뜰하게 사용했어요! 🎉' : '폐기 기록에 남겼어요.')
  }

  const add = (item: Omit<FoodItem, 'id' | 'addedAt' | 'status'>) => {
    addItem(item)
    setShowAdd(false)
    setToast(`${item.name}, 잘 지켜볼게요!`)
  }

  const share = async () => {
    const activeCount = items.filter((item) => item.status === 'active').length
    if (!activeCount) {
      setToast('공유할 보관 중 식재료가 없어요.')
      return
    }
    const url = createShareUrl(items)
    try {
      if (navigator.share) {
        await navigator.share({ title: '우리 집 냉장고 현황', text: `냉장고 파수꾼에서 보낸 식재료 ${activeCount}개예요. 링크를 눌러 바로 병합해 주세요.`, url })
      } else {
        await copyText(url)
        setToast('공유 링크를 복사했어요!')
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      try {
        await copyText(url)
        setToast('공유 링크를 복사했어요!')
      } catch {
        setToast('공유 링크를 만들지 못했어요. 다시 시도해 주세요.')
      }
    }
  }

  const mergeIncoming = () => {
    if (!incomingItems) return
    const result = mergeItems(incomingItems)
    setIncomingItems(null)
    setTab('inventory')
    setToast(result.added ? `${result.added}개를 더했어요${result.skipped ? ` · 중복 ${result.skipped}개 제외` : ''}` : '모두 이미 보관 중인 재료예요.')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setTab('home')}><span className="brand-mark">守</span><span><b>냉장고 파수꾼</b><small>Fridge Guardian</small></span></button>
        <Nav tab={tab} onChange={setTab} />
        <div className="sidebar-tip"><span>🌱</span><p><b>오늘의 작은 실천</b><br />필요한 만큼만 사고,<br />가까운 기한부터 먹어요.</p></div>
      </aside>
      <main>
        <div className="mobile-header"><button className="brand" onClick={() => setTab('home')}><span className="brand-mark">守</span><b>냉장고 파수꾼</b></button><button className="round-add" onClick={() => setShowAdd(true)} aria-label="식재료 등록">＋</button></div>
        <div className="content">
          {tab === 'home' && <Home items={items} onAdd={() => setShowAdd(true)} onShare={share} onNavigate={setTab} onFinish={finish} />}
          {tab === 'inventory' && <Inventory items={items} onAdd={() => setShowAdd(true)} onShare={share} onFinish={finish} />}
          {tab === 'recipes' && <Recipes items={items} />}
          {tab === 'stats' && <Stats items={items} onReset={() => { resetSamples(); setToast('샘플 데이터를 다시 채웠어요.') }} />}
        </div>
      </main>
      <div className="bottom-nav"><Nav tab={tab} onChange={setTab} /></div>
      {showAdd && <AddFoodModal onClose={() => setShowAdd(false)} onSubmit={add} />}
      {incomingItems && <ImportModal items={incomingItems} onClose={() => setIncomingItems(null)} onMerge={mergeIncoming} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
