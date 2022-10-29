import { createIncomingPaymentRoutes } from './incoming-payment'
import { OpenAPI, HttpMethod, createOpenAPI } from 'openapi'
import config from '../config'
import { defaultAxiosInstance, silentLogger } from '../test/helpers'

describe('incoming-payment', (): void => {
  let openApi: OpenAPI

  beforeAll(async () => {
    openApi = await createOpenAPI(config.OPEN_PAYMENTS_OPEN_API_URL)
  })

  const axiosInstance = defaultAxiosInstance
  const logger = silentLogger

  describe('createIncomingPaymentRoutes', (): void => {
    test('calls createResponseValidator properly', async (): Promise<void> => {
      jest.spyOn(openApi, 'createResponseValidator')

      createIncomingPaymentRoutes({
        axiosInstance,
        openApi,
        logger
      })
      expect(openApi.createResponseValidator).toHaveBeenCalledWith({
        path: '/incoming-payments/{id}',
        method: HttpMethod.GET
      })
    })
  })
})