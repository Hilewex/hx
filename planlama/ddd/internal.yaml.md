openapi: 3.1.0
info:
  title: HX Internal Service API
  version: 0.2.0
  description: >
    Internal service-to-service API contract for owner-safe reads, commands,
    callbacks, orchestration and eligibility propagation.
    This spec excludes public/app/panel client contracts.

servers:
  - url: https://internal-api.hx.example.local

tags:
  - name: Checkout Internal
  - name: Checkout Price Lock Internal
  - name: Stock Reservation Internal
  - name: Payment Internal
  - name: Order Internal
  - name: Shipment Internal
  - name: Return Internal
  - name: Settlement Internal
  - name: Payout Internal
  - name: Eligibility Internal
  - name: Notification Internal

paths:
  /internal/checkouts/{checkoutId}:
    get:
      tags: [Checkout Internal]
      summary: Get internal checkout context
      operationId: getInternalCheckout
      security:
        - serviceAuth: []
      parameters:
        - $ref: '#/components/parameters/CheckoutId'
      responses:
        '200':
          description: Internal checkout context
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InternalCheckoutResponse'
        '404':
          $ref: '#/components/responses/NotFound'

  /internal/checkouts/{checkoutId}/payment-context:
    get:
      tags: [Checkout Internal]
      summary: Get validated payment context for checkout
      operationId: getCheckoutPaymentContext
      security:
        - serviceAuth: []
      parameters:
        - $ref: '#/components/parameters/CheckoutId'
      responses:
        '200':
          description: Checkout payment context
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CheckoutPaymentContextResponse'
        '404':
          $ref: '#/components/responses/NotFound'
        '409':
          $ref: '#/components/responses/Conflict'

  /internal/checkouts/{checkoutId}/price-locks:
    post:
      tags: [Checkout Price Lock Internal]
      summary: Create or refresh checkout price lock
      operationId: createCheckoutPriceLock
      security:
        - serviceAuth: []
      x-idempotency-required: true
      parameters:
        - $ref: '#/components/parameters/CheckoutId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateCheckoutPriceLockRequest'
      responses:
        '201':
          description: Checkout price lock accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CheckoutPriceLockCommandResponse'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /internal/price-locks/{priceLockId}:
    get:
      tags: [Checkout Price Lock Internal]
      summary: Get checkout price lock
      operationId: getCheckoutPriceLock
      security:
        - serviceAuth: []
      parameters:
        - $ref: '#/components/parameters/PriceLockId'
      responses:
        '200':
          description: Checkout price lock detail
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CheckoutPriceLockResponse'
        '404':
          $ref: '#/components/responses/NotFound'

  /internal/price-locks/{priceLockId}/consume:
    post:
      tags: [Checkout Price Lock Internal]
      summary: Consume checkout price lock during order/payment progression
      operationId: consumeCheckoutPriceLock
      security:
        - serviceAuth: []
      x-idempotency-required: true
      parameters:
        - $ref: '#/components/parameters/PriceLockId'
      requestBody:
        required: false
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ConsumePriceLockRequest'
      responses:
        '200':
          description: Price lock consume accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '409':
          $ref: '#/components/responses/Conflict'
        '410':
          $ref: '#/components/responses/Gone'

  /internal/price-locks/{priceLockId}/release:
    post:
      tags: [Checkout Price Lock Internal]
      summary: Release checkout price lock
      operationId: releaseCheckoutPriceLock
      security:
        - serviceAuth: []
      x-idempotency-required: true
      parameters:
        - $ref: '#/components/parameters/PriceLockId'
      requestBody:
        required: false
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ReleasePriceLockRequest'
      responses:
        '200':
          description: Price lock release accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '409':
          $ref: '#/components/responses/Conflict'

  /internal/checkouts/{checkoutId}/stock-reservations:
    post:
      tags: [Stock Reservation Internal]
      summary: Create stock reservations for checkout
      operationId: createStockReservations
      security:
        - serviceAuth: []
      x-idempotency-required: true
      parameters:
        - $ref: '#/components/parameters/CheckoutId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateStockReservationsRequest'
      responses:
        '201':
          description: Stock reservations accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StockReservationCommandResponse'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /internal/stock-reservations/{stockReservationId}:
    get:
      tags: [Stock Reservation Internal]
      summary: Get stock reservation
      operationId: getStockReservation
      security:
        - serviceAuth: []
      parameters:
        - $ref: '#/components/parameters/StockReservationId'
      responses:
        '200':
          description: Stock reservation detail
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StockReservationResponse'
        '404':
          $ref: '#/components/responses/NotFound'

  /internal/stock-reservations/{stockReservationId}/consume:
    post:
      tags: [Stock Reservation Internal]
      summary: Consume stock reservation
      operationId: consumeStockReservation
      security:
        - serviceAuth: []
      x-idempotency-required: true
      parameters:
        - $ref: '#/components/parameters/StockReservationId'
      requestBody:
        required: false
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ConsumeStockReservationRequest'
      responses:
        '200':
          description: Stock reservation consume accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '409':
          $ref: '#/components/responses/Conflict'
        '410':
          $ref: '#/components/responses/Gone'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /internal/stock-reservations/{stockReservationId}/release:
    post:
      tags: [Stock Reservation Internal]
      summary: Release stock reservation
      operationId: releaseStockReservation
      security:
        - serviceAuth: []
      x-idempotency-required: true
      parameters:
        - $ref: '#/components/parameters/StockReservationId'
      requestBody:
        required: false
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ReleaseStockReservationRequest'
      responses:
        '200':
          description: Stock reservation release accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '409':
          $ref: '#/components/responses/Conflict'

  /internal/payments:
    post:
      tags: [Payment Internal]
      summary: Create internal payment command
      operationId: createInternalPayment
      security:
        - serviceAuth: []
      x-idempotency-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateInternalPaymentRequest'
      responses:
        '201':
          description: Payment command accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InternalPaymentCommandResponse'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /internal/payments/{paymentId}:
    get:
      tags: [Payment Internal]
      summary: Get payment status
      operationId: getInternalPayment
      security:
        - serviceAuth: []
      parameters:
        - $ref: '#/components/parameters/PaymentId'
      responses:
        '200':
          description: Payment status
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InternalPaymentResponse'
        '404':
          $ref: '#/components/responses/NotFound'

  /internal/payments/{paymentId}/capture-result:
    post:
      tags: [Payment Internal]
      summary: Submit provider capture or callback result
      operationId: submitPaymentCaptureResult
      security:
        - serviceAuth: []
      x-idempotency-required: true
      parameters:
        - $ref: '#/components/parameters/PaymentId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SubmitPaymentCaptureResultRequest'
      responses:
        '200':
          description: Capture result accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /internal/orders:
    post:
      tags: [Order Internal]
      summary: Create order from successful payment
      operationId: createOrderFromPayment
      security:
        - serviceAuth: []
      x-idempotency-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateOrderFromPaymentRequest'
      responses:
        '201':
          description: Order create accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InternalOrderCommandResponse'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /internal/orders/{orderId}:
    get:
      tags: [Order Internal]
      summary: Get internal order detail
      operationId: getInternalOrder
      security:
        - serviceAuth: []
      parameters:
        - $ref: '#/components/parameters/OrderId'
      responses:
        '200':
          description: Internal order response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InternalOrderResponse'
        '404':
          $ref: '#/components/responses/NotFound'

  /internal/orders/{orderId}/shipment-readiness:
    get:
      tags: [Order Internal]
      summary: Get shipment readiness for order
      operationId: getOrderShipmentReadiness
      security:
        - serviceAuth: []
      parameters:
        - $ref: '#/components/parameters/OrderId'
      responses:
        '200':
          description: Shipment readiness response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ShipmentReadinessResponse'
        '404':
          $ref: '#/components/responses/NotFound'

  /internal/shipments:
    post:
      tags: [Shipment Internal]
      summary: Create shipment for order or order group
      operationId: createShipment
      security:
        - serviceAuth: []
      x-idempotency-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateShipmentRequest'
      responses:
        '201':
          description: Shipment create accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InternalShipmentCommandResponse'
        '409':
          $ref: '#/components/responses/Conflict'

  /internal/shipments/{shipmentId}/events:
    post:
      tags: [Shipment Internal]
      summary: Append shipment delivery event
      operationId: appendShipmentEvent
      security:
        - serviceAuth: []
      x-idempotency-required: true
      parameters:
        - $ref: '#/components/parameters/ShipmentId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AppendShipmentEventRequest'
      responses:
        '200':
          description: Shipment event accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '409':
          $ref: '#/components/responses/Conflict'

  /internal/shipments/{shipmentId}/eligibility-propagation:
    post:
      tags: [Eligibility Internal]
      summary: Propagate delivery event effects to eligibility systems
      operationId: propagateShipmentEligibilityEffects
      security:
        - serviceAuth: []
      x-idempotency-required: true
      parameters:
        - $ref: '#/components/parameters/ShipmentId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PropagateShipmentEligibilityEffectsRequest'
      responses:
        '200':
          description: Eligibility propagation accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /internal/returns/{returnRequestId}/decision:
    post:
      tags: [Return Internal]
      summary: Apply return decision
      operationId: applyReturnDecision
      security:
        - serviceAuth: []
      x-idempotency-required: true
      parameters:
        - $ref: '#/components/parameters/ReturnRequestId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApplyReturnDecisionRequest'
      responses:
        '200':
          description: Return decision accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /internal/refunds:
    post:
      tags: [Return Internal]
      summary: Create or execute refund record
      operationId: createRefundRecord
      security:
        - serviceAuth: []
      x-idempotency-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateRefundRecordRequest'
      responses:
        '201':
          description: Refund record accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InternalRefundCommandResponse'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /internal/settlement/lines:
    post:
      tags: [Settlement Internal]
      summary: Create settlement lines for order lines
      operationId: createSettlementLines
      security:
        - serviceAuth: []
      x-idempotency-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateSettlementLinesRequest'
      responses:
        '201':
          description: Settlement line creation accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InternalSettlementCommandResponse'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /internal/settlement/lines/{settlementLineId}/adjustments:
    post:
      tags: [Settlement Internal]
      summary: Create settlement adjustment
      operationId: createSettlementAdjustment
      security:
        - serviceAuth: []
      x-idempotency-required: true
      parameters:
        - $ref: '#/components/parameters/SettlementLineId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateSettlementAdjustmentRequest'
      responses:
        '201':
          description: Settlement adjustment accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '409':
          $ref: '#/components/responses/Conflict'

  /internal/payout/batches:
    post:
      tags: [Payout Internal]
      summary: Create payout batch from payable settlement lines
      operationId: createPayoutBatch
      security:
        - serviceAuth: []
      x-idempotency-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePayoutBatchRequest'
      responses:
        '201':
          description: Payout batch accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InternalPayoutBatchCommandResponse'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /internal/payout/batches/{payoutBatchId}/result:
    post:
      tags: [Payout Internal]
      summary: Submit payout batch execution result
      operationId: submitPayoutBatchResult
      security:
        - serviceAuth: []
      x-idempotency-required: true
      parameters:
        - $ref: '#/components/parameters/PayoutBatchId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SubmitPayoutBatchResultRequest'
      responses:
        '200':
          description: Payout result accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '409':
          $ref: '#/components/responses/Conflict'

  /internal/eligibility/verified-purchase:
    post:
      tags: [Eligibility Internal]
      summary: Upsert verified purchase eligibility
      operationId: upsertVerifiedPurchaseEligibility
      security:
        - serviceAuth: []
      x-idempotency-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpsertVerifiedPurchaseEligibilityRequest'
      responses:
        '200':
          description: Verified purchase eligibility accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '409':
          $ref: '#/components/responses/Conflict'

  /internal/eligibility/review:
    post:
      tags: [Eligibility Internal]
      summary: Upsert review eligibility
      operationId: upsertReviewEligibility
      security:
        - serviceAuth: []
      x-idempotency-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpsertReviewEligibilityRequest'
      responses:
        '200':
          description: Review eligibility accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '409':
          $ref: '#/components/responses/Conflict'

  /internal/eligibility/story:
    post:
      tags: [Eligibility Internal]
      summary: Upsert story eligibility
      operationId: upsertStoryEligibility
      security:
        - serviceAuth: []
      x-idempotency-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpsertStoryEligibilityRequest'
      responses:
        '200':
          description: Story eligibility accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '409':
          $ref: '#/components/responses/Conflict'

  /internal/eligibility/reward-impacts:
    post:
      tags: [Eligibility Internal]
      summary: Upsert reward entitlement impact
      operationId: upsertRewardEntitlementImpact
      security:
        - serviceAuth: []
      x-idempotency-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpsertRewardEntitlementImpactRequest'
      responses:
        '200':
          description: Reward entitlement impact accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '409':
          $ref: '#/components/responses/Conflict'

  /internal/notifications:
    post:
      tags: [Notification Internal]
      summary: Enqueue internal notification command
      operationId: createInternalNotification
      security:
        - serviceAuth: []
      x-idempotency-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateInternalNotificationRequest'
      responses:
        '201':
          description: Notification accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '409':
          $ref: '#/components/responses/Conflict'

components:
  securitySchemes:
    serviceAuth:
      type: http
      scheme: bearer
      bearerFormat: service-jwt

  parameters:
    CheckoutId:
      name: checkoutId
      in: path
      required: true
      schema:
        type: string
    PriceLockId:
      name: priceLockId
      in: path
      required: true
      schema:
        type: string
    StockReservationId:
      name: stockReservationId
      in: path
      required: true
      schema:
        type: string
    PaymentId:
      name: paymentId
      in: path
      required: true
      schema:
        type: string
    OrderId:
      name: orderId
      in: path
      required: true
      schema:
        type: string
    ShipmentId:
      name: shipmentId
      in: path
      required: true
      schema:
        type: string
    ReturnRequestId:
      name: returnRequestId
      in: path
      required: true
      schema:
        type: string
    SettlementLineId:
      name: settlementLineId
      in: path
      required: true
      schema:
        type: string
    PayoutBatchId:
      name: payoutBatchId
      in: path
      required: true
      schema:
        type: string

  responses:
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    Conflict:
      description: State conflict or duplicate request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    UnprocessableEntity:
      description: Domain validation failed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    Gone:
      description: Resource expired or no longer usable
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'

  schemas:
    CommandAcceptedResponse:
      type: object
      required: [status, command_id]
      properties:
        status:
          type: string
          enum: [accepted]
        command_id:
          type: string

    InternalCheckoutResponse:
      type: object
      required: [checkout_id, checkout_state]
      properties:
        checkout_id:
          type: string
        checkout_state:
          type: string
        actor_ref:
          type: string
          nullable: true
        reviewed_totals:
          $ref: '#/components/schemas/MoneySummary'

    CheckoutPaymentContextResponse:
      type: object
      required: [checkout_id, currency, final_total, line_items]
      properties:
        checkout_id:
          type: string
        currency:
          type: string
        final_total:
          $ref: '#/components/schemas/Money'
        line_items:
          type: array
          items:
            $ref: '#/components/schemas/CheckoutPaymentLine'
        address_context:
          type: object
          additionalProperties: true
        coupon_context:
          type: object
          additionalProperties: true
          nullable: true
        campaign_context:
          type: object
          additionalProperties: true
          nullable: true
        storefront_context:
          type: object
          additionalProperties: true
          nullable: true

    CheckoutPaymentLine:
      type: object
      required: [order_candidate_id, product_id, quantity, final_line_total]
      properties:
        order_candidate_id:
          type: string
        product_id:
          type: string
        variant_id:
          type: string
          nullable: true
        quantity:
          type: integer
        final_line_total:
          $ref: '#/components/schemas/Money'

    CreateCheckoutPriceLockRequest:
      type: object
      required: [checkout_id, line_items, valid_until]
      properties:
        checkout_id:
          type: string
        line_items:
          type: array
          items:
            type: object
            additionalProperties: true
        price_version_ref:
          type: string
          nullable: true
        valid_until:
          type: string
          format: date-time

    CheckoutPriceLockCommandResponse:
      type: object
      required: [price_lock_id, lock_state]
      properties:
        price_lock_id:
          type: string
        lock_state:
          type: string
          enum: [active, consumed, released, expired]

    CheckoutPriceLockResponse:
      type: object
      required: [price_lock_id, checkout_id, lock_state]
      properties:
        price_lock_id:
          type: string
        checkout_id:
          type: string
        lock_state:
          type: string
          enum: [active, consumed, released, expired]
        valid_until:
          type: string
          format: date-time
          nullable: true
        price_version_ref:
          type: string
          nullable: true

    ConsumePriceLockRequest:
      type: object
      properties:
        order_id:
          type: string
          nullable: true
        payment_id:
          type: string
          nullable: true

    ReleasePriceLockRequest:
      type: object
      properties:
        reason_code:
          type: string
          nullable: true

    CreateStockReservationsRequest:
      type: object
      required: [checkout_id, items]
      properties:
        checkout_id:
          type: string
        items:
          type: array
          items:
            type: object
            required: [product_id, quantity]
            properties:
              product_id:
                type: string
              variant_id:
                type: string
                nullable: true
              quantity:
                type: integer
              stock_location_ref:
                type: string
                nullable: true

    StockReservationCommandResponse:
      type: object
      required: [stock_reservation_ids]
      properties:
        stock_reservation_ids:
          type: array
          items:
            type: string

    StockReservationResponse:
      type: object
      required: [stock_reservation_id, checkout_id, reservation_state, reserved_quantity]
      properties:
        stock_reservation_id:
          type: string
        checkout_id:
          type: string
        order_id:
          type: string
          nullable: true
        product_id:
          type: string
        variant_id:
          type: string
          nullable: true
        reserved_quantity:
          type: integer
        reservation_state:
          type: string
          enum: [created, active, released, consumed, expired]
        reserved_until:
          type: string
          format: date-time
          nullable: true

    ConsumeStockReservationRequest:
      type: object
      properties:
        order_id:
          type: string
          nullable: true

    ReleaseStockReservationRequest:
      type: object
      properties:
        reason_code:
          type: string
          nullable: true

    CreateInternalPaymentRequest:
      type: object
      required: [checkout_id, payment_context_ref, amount]
      properties:
        checkout_id:
          type: string
        payment_context_ref:
          type: string
        amount:
          $ref: '#/components/schemas/Money'
        provider:
          type: string
          nullable: true
        actor_ref:
          type: string
          nullable: true

    InternalPaymentCommandResponse:
      type: object
      required: [payment_id, payment_state]
      properties:
        payment_id:
          type: string
        payment_state:
          type: string

    InternalPaymentResponse:
      type: object
      required: [payment_id, payment_state]
      properties:
        payment_id:
          type: string
        payment_state:
          type: string
        provider_reference:
          type: string
          nullable: true
        captured_amount:
          $ref: '#/components/schemas/Money'
        refund_summary:
          type: object
          additionalProperties: true
          nullable: true

    SubmitPaymentCaptureResultRequest:
      type: object
      required: [provider_event_id, result]
      properties:
        provider_event_id:
          type: string
        result:
          type: string
          enum: [captured, failed, canceled]
        provider_reference:
          type: string
          nullable: true
        amount:
          $ref: '#/components/schemas/Money'
        raw_payload_ref:
          type: string
          nullable: true

    CreateOrderFromPaymentRequest:
      type: object
      required: [payment_id, checkout_id]
      properties:
        payment_id:
          type: string
        checkout_id:
          type: string
        payment_attempt_ref:
          type: string
          nullable: true
        consumed_price_lock_id:
          type: string
          nullable: true
        consumed_stock_reservation_ids:
          type: array
          items:
            type: string
          nullable: true

    InternalOrderCommandResponse:
      type: object
      required: [order_id, order_state]
      properties:
        order_id:
          type: string
        order_state:
          type: string

    InternalOrderResponse:
      type: object
      required: [order_id, order_state, lines]
      properties:
        order_id:
          type: string
        order_state:
          type: string
        lines:
          type: array
          items:
            $ref: '#/components/schemas/InternalOrderLine'
        pricing_snapshot_ref:
          type: string
          nullable: true
        address_snapshot_ref:
          type: string
          nullable: true

    InternalOrderLine:
      type: object
      required: [order_line_id, product_id, quantity]
      properties:
        order_line_id:
          type: string
        product_id:
          type: string
        quantity:
          type: integer
        final_line_total:
          $ref: '#/components/schemas/Money'

    ShipmentReadinessResponse:
      type: object
      required: [order_id, ready]
      properties:
        order_id:
          type: string
        ready:
          type: boolean
        line_groups:
          type: array
          items:
            type: object
            additionalProperties: true

    CreateShipmentRequest:
      type: object
      required: [order_id, line_allocations]
      properties:
        order_id:
          type: string
        line_allocations:
          type: array
          items:
            type: object
            additionalProperties: true
        carrier_ref:
          type: string
          nullable: true

    InternalShipmentCommandResponse:
      type: object
      required: [shipment_id, shipment_state]
      properties:
        shipment_id:
          type: string
        shipment_state:
          type: string

    AppendShipmentEventRequest:
      type: object
      required: [event_type, event_time]
      properties:
        event_type:
          type: string
          enum: [prepared, shipped, delivered, failed, returned_to_sender]
        event_time:
          type: string
          format: date-time
        provider_event_id:
          type: string
          nullable: true
        raw_payload_ref:
          type: string
          nullable: true

    PropagateShipmentEligibilityEffectsRequest:
      type: object
      required: [trigger_event_type]
      properties:
        trigger_event_type:
          type: string
          enum: [delivered, returned_to_sender, failed]
        delivery_event_id:
          type: string
          nullable: true
        order_id:
          type: string
          nullable: true
        order_line_ids:
          type: array
          items:
            type: string
          nullable: true

    ApplyReturnDecisionRequest:
      type: object
      required: [decision]
      properties:
        decision:
          type: string
          enum: [approve, reject, escalate]
        reason_code:
          type: string
          nullable: true
        note:
          type: string
          nullable: true

    CreateRefundRecordRequest:
      type: object
      required: [payment_id, refund_amount]
      properties:
        payment_id:
          type: string
        return_request_id:
          type: string
          nullable: true
        cancel_request_id:
          type: string
          nullable: true
        order_id:
          type: string
          nullable: true
        order_line_id:
          type: string
          nullable: true
        refund_amount:
          $ref: '#/components/schemas/Money'

    InternalRefundCommandResponse:
      type: object
      required: [refund_record_id, refund_state]
      properties:
        refund_record_id:
          type: string
        refund_state:
          type: string

    CreateSettlementLinesRequest:
      type: object
      required: [order_id, order_line_ids]
      properties:
        order_id:
          type: string
        order_line_ids:
          type: array
          items:
            type: string
        pricing_snapshot_ref:
          type: string
          nullable: true
        coupon_snapshot_ref:
          type: string
          nullable: true
        campaign_effect_snapshot_ref:
          type: string
          nullable: true

    InternalSettlementCommandResponse:
      type: object
      required: [settlement_line_ids]
      properties:
        settlement_line_ids:
          type: array
          items:
            type: string

    CreateSettlementAdjustmentRequest:
      type: object
      required: [adjustment_amount, trigger_type]
      properties:
        adjustment_amount:
          $ref: '#/components/schemas/Money'
        trigger_type:
          type: string
          enum: [refund, return, sponsor_correction, manual_correction]
        affected_side:
          type: string
          nullable: true
        reason_code:
          type: string
          nullable: true

    CreatePayoutBatchRequest:
      type: object
      required: [recipient_type, recipient_id]
      properties:
        recipient_type:
          type: string
        recipient_id:
          type: string
        settlement_line_ids:
          type: array
          items:
            type: string
        batch_period:
          type: string
          nullable: true

    InternalPayoutBatchCommandResponse:
      type: object
      required: [payout_batch_id, payout_state]
      properties:
        payout_batch_id:
          type: string
        payout_state:
          type: string

    SubmitPayoutBatchResultRequest:
      type: object
      required: [result]
      properties:
        result:
          type: string
          enum: [paid, partial_failure, failed, held]
        transfer_reference:
          type: string
          nullable: true
        item_results:
          type: array
          items:
            type: object
            additionalProperties: true

    UpsertVerifiedPurchaseEligibilityRequest:
      type: object
      required: [order_id, order_line_id, user_id, eligibility_state]
      properties:
        order_id:
          type: string
        order_line_id:
          type: string
        user_id:
          type: string
        eligibility_state:
          type: string
          enum: [inactive, active, revoked]
        activated_by_delivery_event_ref:
          type: string
          nullable: true
        revoked_by_return_request_ref:
          type: string
          nullable: true

    UpsertReviewEligibilityRequest:
      type: object
      required: [order_id, order_line_id, user_id, product_id, eligibility_state]
      properties:
        order_id:
          type: string
        order_line_id:
          type: string
        user_id:
          type: string
        product_id:
          type: string
        eligibility_state:
          type: string
          enum: [inactive, active, consumed, revoked]

    UpsertStoryEligibilityRequest:
      type: object
      required: [order_id, order_line_id, user_id, product_id, eligibility_state]
      properties:
        order_id:
          type: string
        order_line_id:
          type: string
        user_id:
          type: string
        product_id:
          type: string
        eligibility_state:
          type: string
          enum: [inactive, active, consumed, revoked]
        remaining_story_quota:
          type: integer
          nullable: true

    UpsertRewardEntitlementImpactRequest:
      type: object
      required: [user_id, order_id, order_line_id, trigger_type]
      properties:
        user_id:
          type: string
        order_id:
          type: string
        order_line_id:
          type: string
        trigger_type:
          type: string
          enum: [delivery, review, story, return, policy_revoke]
        pending_points:
          type: integer
          nullable: true
        vested_points:
          type: integer
          nullable: true
        revoked_points:
          type: integer
          nullable: true

    CreateInternalNotificationRequest:
      type: object
      required: [recipient_ref, template_type]
      properties:
        recipient_ref:
          type: string
        template_type:
          type: string
        target_ref:
          type: string
          nullable: true
        payload:
          type: object
          additionalProperties: true

    Money:
      type: object
      required: [amount, currency]
      properties:
        amount:
          type: number
          format: float
        currency:
          type: string

    MoneySummary:
      type: object
      properties:
        subtotal:
          $ref: '#/components/schemas/Money'
        shipping_total:
          $ref: '#/components/schemas/Money'
        discount_total:
          $ref: '#/components/schemas/Money'
        final_total:
          $ref: '#/components/schemas/Money'

    ErrorResponse:
      type: object
      required: [code, message]
      properties:
        code:
          type: string
        message:
          type: string
        details:
          type: object
          additionalProperties: true
          nullable: true
        request_id:
          type: string
          nullable: true