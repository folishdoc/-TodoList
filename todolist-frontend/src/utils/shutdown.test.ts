import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { registerShutdownListener, unregisterShutdownListener } from './shutdown'

describe('utils/shutdown.ts', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>
  let docAddEventListenerSpy: ReturnType<typeof vi.spyOn>
  let docRemoveEventListenerSpy: ReturnType<typeof vi.spyOn>
  let sendBeaconSpy: ReturnType<typeof vi.spyOn> | null

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    docAddEventListenerSpy = vi.spyOn(document, 'addEventListener')
    docRemoveEventListenerSpy = vi.spyOn(document, 'removeEventListener')
    sendBeaconSpy = 'sendBeacon' in navigator
      ? vi.spyOn(navigator, 'sendBeacon').mockReturnValue(true)
      : null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('registerShutdownListener', () => {
    it('registers beforeunload event on window', () => {
      registerShutdownListener()
      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    })

    it('registers visibilitychange event on document', () => {
      registerShutdownListener()
      expect(docAddEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function),
      )
    })

    it('registers both event listeners', () => {
      registerShutdownListener()
      expect(addEventListenerSpy).toHaveBeenCalledTimes(1)
      expect(docAddEventListenerSpy).toHaveBeenCalledTimes(1)
    })

    it('can be called multiple times without error', () => {
      registerShutdownListener()
      registerShutdownListener()
      registerShutdownListener()
      expect(addEventListenerSpy).toHaveBeenCalledTimes(3)
      expect(docAddEventListenerSpy).toHaveBeenCalledTimes(3)
    })
  })

  describe('unregisterShutdownListener', () => {
    it('removes beforeunload event from window', () => {
      registerShutdownListener()
      unregisterShutdownListener()
      expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    })

    it('removes visibilitychange event from document', () => {
      registerShutdownListener()
      unregisterShutdownListener()
      expect(docRemoveEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function),
      )
    })

    it('removes both event listeners', () => {
      registerShutdownListener()
      unregisterShutdownListener()
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(1)
      expect(docRemoveEventListenerSpy).toHaveBeenCalledTimes(1)
    })

    it('can be called without registering first (no error)', () => {
      expect(() => unregisterShutdownListener()).not.toThrow()
    })
  })

  describe('beforeunload event handler', () => {
    it('sends shutdown beacon when beforeunload fires', () => {
      if (!sendBeaconSpy) return // skip if sendBeacon not available
      let handler: EventListener | undefined
      addEventListenerSpy.mockImplementation((_event: string, cb: EventListener) => {
        handler = cb
      })
      registerShutdownListener()

      expect(handler).toBeDefined()
      handler!(new Event('beforeunload'))

      expect(sendBeaconSpy).toHaveBeenCalledTimes(1)
      expect(sendBeaconSpy.mock.calls[0][0]).toContain('/api/system/shutdown')
    })

    it('does not send duplicate shutdown on consecutive beforeunload', () => {
      if (!sendBeaconSpy) return
      let handler: EventListener | undefined
      addEventListenerSpy.mockImplementation((_event: string, cb: EventListener) => {
        handler = cb
      })
      registerShutdownListener()

      handler!(new Event('beforeunload'))
      handler!(new Event('beforeunload'))
      handler!(new Event('beforeunload'))

      expect(sendBeaconSpy).toHaveBeenCalledTimes(1)
    })

    it('sends JSON body with action:shutdown', () => {
      if (!sendBeaconSpy) return
      let handler: EventListener | undefined
      addEventListenerSpy.mockImplementation((_event: string, cb: EventListener) => {
        handler = cb
      })
      registerShutdownListener()

      handler!(new Event('beforeunload'))

      const sentBlob = sendBeaconSpy.mock.calls[0][1] as Blob
      expect(sentBlob).toBeInstanceOf(Blob)
      expect(sentBlob.type).toBe('application/json')
    })
  })

  describe('visibilitychange event handler', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('sends beacon after 5s if page stays hidden', () => {
      if (!sendBeaconSpy) return
      let handler: EventListener | undefined
      docAddEventListenerSpy.mockImplementation((_event: string, cb: EventListener) => {
        handler = cb
      })
      registerShutdownListener()

      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
      handler!(new Event('visibilitychange'))

      expect(sendBeaconSpy).not.toHaveBeenCalled()

      vi.advanceTimersByTime(5000)

      expect(sendBeaconSpy).toHaveBeenCalledTimes(1)
    })

    it('does not send beacon if page becomes visible again within 5s', () => {
      if (!sendBeaconSpy) return
      let handler: EventListener | undefined
      docAddEventListenerSpy.mockImplementation((_event: string, cb: EventListener) => {
        handler = cb
      })
      registerShutdownListener()

      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
      handler!(new Event('visibilitychange'))

      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })

      vi.advanceTimersByTime(5000)

      expect(sendBeaconSpy).not.toHaveBeenCalled()
    })

    it('does not send beacon on visibilitychange to visible', () => {
      if (!sendBeaconSpy) return
      let handler: EventListener | undefined
      docAddEventListenerSpy.mockImplementation((_event: string, cb: EventListener) => {
        handler = cb
      })
      registerShutdownListener()

      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
      handler!(new Event('visibilitychange'))

      vi.advanceTimersByTime(5000)
      expect(sendBeaconSpy).not.toHaveBeenCalled()
    })

    it('does not send duplicate shutdown after beforeunload already sent', () => {
      if (!sendBeaconSpy) return
      let beforeunloadHandler: EventListener | undefined
      let visibilityHandler: EventListener | undefined

      addEventListenerSpy.mockImplementation((event: string, cb: EventListener) => {
        if (event === 'beforeunload') beforeunloadHandler = cb
      })
      docAddEventListenerSpy.mockImplementation((event: string, cb: EventListener) => {
        if (event === 'visibilitychange') visibilityHandler = cb
      })

      registerShutdownListener()

      beforeunloadHandler!(new Event('beforeunload'))
      expect(sendBeaconSpy).toHaveBeenCalledTimes(1)

      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
      visibilityHandler!(new Event('visibilitychange'))

      vi.advanceTimersByTime(5000)
      expect(sendBeaconSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('sendShutdownRequest (via beforeunload)', () => {
    it('uses VITE_API_BASE_URL when available', () => {
      if (!sendBeaconSpy) return
      // Save original env
      const originalEnv = import.meta.env.VITE_API_BASE_URL

      // Set a custom API base URL
      import.meta.env.VITE_API_BASE_URL = 'http://custom:8080/api'

      let handler: EventListener | undefined
      addEventListenerSpy.mockImplementation((_event: string, cb: EventListener) => {
        handler = cb
      })
      registerShutdownListener()
      handler!(new Event('beforeunload'))

      expect(sendBeaconSpy.mock.calls[0][0]).toBe(
        'http://custom:8080/api/system/shutdown',
      )

      // Restore
      import.meta.env.VITE_API_BASE_URL = originalEnv
    })
  })
})
