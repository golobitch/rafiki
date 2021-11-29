import { createILPContext } from '../../utils'
import {
  IlpPrepareFactory,
  InvoiceAccountFactory,
  PeerAccountFactory,
  RafikiServicesFactory
} from '../../factories'
import { createAccountMiddleware } from '../../middleware/account'
import { ZeroCopyIlpPrepare } from '../..'
import { Balance } from '../../../../accounting/service'

describe('Account Middleware', () => {
  const ADDRESS = 'test.rafiki'
  const incomingAccount = PeerAccountFactory.build({
    id: 'incomingPeer'
  })
  const rafikiServices = RafikiServicesFactory.build({})

  beforeAll(async () => {
    await rafikiServices.accounts.create(incomingAccount)
  })

  test('set the accounts according to state and destination', async () => {
    const outgoingAccount = PeerAccountFactory.build({
      id: 'outgoingPeer'
    })
    await rafikiServices.accounts.create(outgoingAccount)

    const middleware = createAccountMiddleware(ADDRESS)
    const next = jest.fn()
    const ctx = createILPContext({
      state: { incomingAccount },
      services: rafikiServices,
      request: {
        prepare: new ZeroCopyIlpPrepare(
          IlpPrepareFactory.build({ destination: 'test.outgoingPeer.123' })
        ),
        rawPrepare: Buffer.alloc(0) // ignored
      }
    })
    await expect(middleware(ctx, next)).resolves.toBeUndefined()

    expect(ctx.accounts.incoming).toEqual(incomingAccount)
    expect(ctx.accounts.outgoing).toEqual(outgoingAccount)
  })

  test('set the accounts according to state and streamDestination', async () => {
    const outgoingAccount = InvoiceAccountFactory.build({
      id: 'outgoingInvoice'
    })
    await rafikiServices.accounts.create(outgoingAccount)
    const middleware = createAccountMiddleware(ADDRESS)
    const next = jest.fn()
    const ctx = createILPContext({
      state: {
        incomingAccount,
        streamDestination: outgoingAccount.id
      },
      services: rafikiServices,
      request: {
        prepare: new ZeroCopyIlpPrepare(
          IlpPrepareFactory.build({ destination: 'test.123' })
        ),
        rawPrepare: Buffer.alloc(0) // ignored
      }
    })
    await expect(middleware(ctx, next)).resolves.toBeUndefined()

    expect(ctx.accounts.incoming).toEqual(incomingAccount)
    expect(ctx.accounts.outgoing).toEqual({
      id: outgoingAccount.id,
      asset: outgoingAccount.asset,
      withBalance: Balance.ReceiveLimit,
      stream: {
        enabled: true
      }
    })
  })

  test('return an error when the destination account is disabled', async () => {
    const outgoingAccount = InvoiceAccountFactory.build({
      id: 'deactivatedInvoice',
      active: false
    })
    await rafikiServices.accounts.create(outgoingAccount)
    const middleware = createAccountMiddleware(ADDRESS)
    const next = jest.fn()
    const ctx = createILPContext({
      state: {
        incomingAccount,
        streamDestination: outgoingAccount.id
      },
      services: rafikiServices,
      request: {
        prepare: new ZeroCopyIlpPrepare(
          IlpPrepareFactory.build({ destination: 'test.123' })
        ),
        rawPrepare: Buffer.alloc(0) // ignored
      }
    })
    await expect(middleware(ctx, next)).rejects.toThrowError(
      'destination account is disabled'
    )
  })
})