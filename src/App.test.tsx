import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSampleItems } from './data'
import { createShareUrl } from './lib/share'
import App from './App'

describe('냉장고 파수꾼', () => {
  beforeEach(() => localStorage.clear())

  it('샘플 데이터와 임박 알림을 보여준다', () => {
    render(<App />)
    expect(screen.getByText('안녕하세요, 파수꾼님!')).toBeInTheDocument()
    expect(screen.getByText('시금치')).toBeInTheDocument()
    expect(screen.getByText(/재료를.*먼저 챙겨주세요/)).toBeInTheDocument()
  })

  it('새 식재료를 등록하고 브라우저 저장소에 보관한다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '식재료 등록' }))
    await user.type(screen.getByLabelText('이름'), '토마토')
    await user.clear(screen.getByLabelText('수량'))
    await user.type(screen.getByLabelText('수량'), '3')
    await user.click(screen.getByRole('button', { name: '파수꾼에게 맡기기' }))

    expect(screen.getByRole('status')).toHaveTextContent('토마토, 잘 지켜볼게요!')
    expect(localStorage.getItem('fridge-guardian-items-v1')).toContain('토마토')
  })

  it('식재료를 사용 완료로 처리한다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '시금치 사용 완료' }))
    expect(screen.getByRole('status')).toHaveTextContent('알뜰하게 사용했어요!')
    expect(localStorage.getItem('fridge-guardian-items-v1')).toContain('"status":"used"')
  })

  it('모바일 공유 시트에 병합 링크를 전달한다', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { value: share, configurable: true })
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '가족에게 냉장고 공유' }))

    expect(share).toHaveBeenCalledOnce()
    expect(share.mock.calls[0][0].url).toContain('#share=')
    expect(share.mock.calls[0][0].text).toContain('식재료 9개')
  })

  it('공유 링크를 열어 새 식재료를 한 번에 병합한다', async () => {
    const shared = createSampleItems(new Date(2026, 9, 8)).slice(0, 1).map((item) => ({ ...item, id: 'family-tomato', name: '방울토마토', emoji: '🍅' }))
    const shareUrl = createShareUrl(shared, window.location.href)
    window.history.replaceState(null, '', new URL(shareUrl).hash)
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText('가족의 냉장고가 도착했어요')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '1개 목록 병합하기' }))

    expect(screen.getByText('방울토마토')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('1개를 더했어요')
  })
})
