openapi: 3.1.0
info:
  title: HX App API
  version: 0.2.0
  description: >
    Authenticated and guest-checkout application API contract for mobile/web clients.
    This spec includes user-private app surfaces, cart/checkout/order flows, interactions,
    review/story/question/support entry surfaces, notification center, and reward-facing reads.
    Panel-only and internal service contracts are intentionally excluded.

servers:
  - url: https://api.hx.example.com

tags:
  - name: Session
  - name: Cart
  - name: Checkout
  - name: Orders
  - name: Account
  - name: Notifications
  - name: Interactions
  - name: Follow
  - name: Reviews
  - name: Stories
  - name: Questions
  - name: Support
  - name: Rewards
  - name: Viewer

paths:
  /app/session:
    get:
      tags: [Session]
      summary: Get session context
      operationId: getSessionContext
      responses:
        '200':
          description: Session context
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SessionContextResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /app/cart:
    get:
      tags: [Cart]
      summary: Get current cart
      operationId: getCart
      security:
        - bearerAuth: []
        - guestCheckout: []
      responses:
        '200':
          description: Current cart
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CartResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /app/cart/items:
    post:
      tags: [Cart]
      summary: Add item to cart
      operationId: addCartItem
      security:
        - bearerAuth: []
        - guestCheckout: []
      x-idempotency-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AddCartItemRequest'
      responses:
        '200':
          description: Updated cart
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CartResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /app/cart/items/{cartItemId}:
    patch:
      tags: [Cart]
      summary: Update cart item quantity or selection
      operationId: updateCartItem
      security:
        - bearerAuth: []
        - guestCheckout: []
      x-idempotency-required: true
      parameters:
        - $ref: '#/components/parameters/CartItemId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateCartItemRequest'
      responses:
        '200':
          description: Updated cart
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CartResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '404':
          $ref: '#/components/responses/NotFound'
        '409':
          $ref: '#/components/responses/Conflict'

    delete:
      tags: [Cart]
      summary: Remove item from cart
      operationId: removeCartItem
      security:
        - bearerAuth: []
        - guestCheckout: []
      parameters:
        - $ref: '#/components/parameters/CartItemId'
      responses:
        '204':
          description: Item removed
        '404':
          $ref: '#/components/responses/NotFound'

  /app/checkout/review:
    post:
      tags: [Checkout]
      summary: Review cart and create or refresh checkout context
      operationId: reviewCheckout
      security:
        - bearerAuth: []
        - guestCheckout: []
      x-idempotency-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CheckoutReviewRequest'
      responses:
        '200':
          description: Checkout review result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CheckoutReviewResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /app/checkout/{checkoutId}:
    get:
      tags: [Checkout]
      summary: Get checkout detail
      operationId: getCheckout
      security:
        - bearerAuth: []
        - guestCheckout: []
      parameters:
        - $ref: '#/components/parameters/CheckoutId'
      responses:
        '200':
          description: Checkout detail
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CheckoutDetailResponse'
        '404':
          $ref: '#/components/responses/NotFound'
        '410':
          $ref: '#/components/responses/Gone'

  /app/checkout/{checkoutId}/payment-intents:
    post:
      tags: [Checkout]
      summary: Start payment for checkout
      operationId: createPaymentIntentForCheckout
      security:
        - bearerAuth: []
        - guestCheckout: []
      x-idempotency-required: true
      parameters:
        - $ref: '#/components/parameters/CheckoutId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePaymentIntentRequest'
      responses:
        '200':
          description: Payment start result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CreatePaymentIntentResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /app/orders:
    get:
      tags: [Orders]
      summary: List user orders
      operationId: listOrders
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: User order list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OrderListResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /app/orders/{orderId}:
    get:
      tags: [Orders]
      summary: Get order detail
      operationId: getOrder
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/OrderId'
      responses:
        '200':
          description: Order detail
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OrderDetailResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'

  /app/orders/{orderId}/cancel-requests:
    post:
      tags: [Orders]
      summary: Create cancel request
      operationId: createCancelRequest
      security:
        - bearerAuth: []
      x-idempotency-required: true
      parameters:
        - $ref: '#/components/parameters/OrderId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateCancelRequest'
      responses:
        '201':
          description: Cancel request created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CancelRequestResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /app/orders/{orderId}/return-requests:
    post:
      tags: [Orders]
      summary: Create return request
      operationId: createReturnRequest
      security:
        - bearerAuth: []
      x-idempotency-required: true
      parameters:
        - $ref: '#/components/parameters/OrderId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateReturnRequest'
      responses:
        '201':
          description: Return request created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ReturnRequestResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /app/account:
    get:
      tags: [Account]
      summary: Get account dashboard
      operationId: getAccountDashboard
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Account dashboard
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AccountDashboardResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/DegradedUnavailable'

  /app/account/addresses:
    get:
      tags: [Account]
      summary: List saved addresses
      operationId: listAddresses
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Address list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AddressListResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'

    post:
      tags: [Account]
      summary: Create address
      operationId: createAddress
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateAddressRequest'
      responses:
        '201':
          description: Address created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AddressResponse'
        '400':
          $ref: '#/components/responses/BadRequest'

  /app/account/addresses/{addressId}:
    patch:
      tags: [Account]
      summary: Update address
      operationId: updateAddress
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/AddressId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateAddressRequest'
      responses:
        '200':
          description: Address updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AddressResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '404':
          $ref: '#/components/responses/NotFound'

    delete:
      tags: [Account]
      summary: Delete or deactivate address
      operationId: deleteAddress
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/AddressId'
      responses:
        '204':
          description: Address deleted or deactivated
        '404':
          $ref: '#/components/responses/NotFound'

  /app/notifications:
    get:
      tags: [Notifications]
      summary: Get notification center
      operationId: getNotifications
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: Notification center response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NotificationListResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '503':
          $ref: '#/components/responses/DegradedUnavailable'

  /app/notifications/{notificationId}/read:
    post:
      tags: [Notifications]
      summary: Mark notification as read
      operationId: markNotificationRead
      security:
        - bearerAuth: []
      x-idempotency-required: true
      parameters:
        - $ref: '#/components/parameters/NotificationId'
      responses:
        '204':
          description: Notification marked as read
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'

  /app/interactions/likes:
    post:
      tags: [Interactions]
      summary: Register like action
      operationId: createLike
      security:
        - bearerAuth: []
      x-idempotency-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateLikeRequest'
      responses:
        '200':
          description: Like state updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InteractionStateResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'

  /app/interactions/saves:
    post:
      tags: [Interactions]
      summary: Set save state for target
      operationId: setSave
      security:
        - bearerAuth: []
      x-idempotency-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SetSaveRequest'
      responses:
        '200':
          description: Save state updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InteractionStateResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'

  /app/follows:
    post:
      tags: [Follow]
      summary: Set follow state for storefront or creator
      operationId: setFollow
      security:
        - bearerAuth: []
      x-idempotency-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SetFollowRequest'
      responses:
        '200':
          description: Follow state updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FollowStateResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'

  /app/products/{productId}/reviews:
    post:
      tags: [Reviews]
      summary: Create product review
      operationId: createProductReview
      security:
        - bearerAuth: []
      x-idempotency-required: true
      parameters:
        - $ref: '#/components/parameters/ProductId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateReviewRequest'
      responses:
        '201':
          description: Review accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ReviewCommandResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /app/products/{productId}/questions:
    post:
      tags: [Questions]
      summary: Create product question
      operationId: createProductQuestion
      security:
        - bearerAuth: []
      x-idempotency-required: true
      parameters:
        - $ref: '#/components/parameters/ProductId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateQuestionRequest'
      responses:
        '201':
          description: Question accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QuestionCommandResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /app/stories:
    post:
      tags: [Stories]
      summary: Create user product story
      operationId: createUserStory
      security:
        - bearerAuth: []
      x-idempotency-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserStoryRequest'
      responses:
        '201':
          description: Story accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StoryCommandResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /app/support/tickets:
    post:
      tags: [Support]
      summary: Create support ticket
      operationId: createSupportTicket
      security:
        - bearerAuth: []
      x-idempotency-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateSupportTicketRequest'
      responses:
        '201':
          description: Support ticket created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SupportTicketResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

    get:
      tags: [Support]
      summary: List my support tickets
      operationId: listMySupportTickets
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: Support ticket list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SupportTicketListResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /app/rewards/balance:
    get:
      tags: [Rewards]
      summary: Get reward balance
      operationId: getRewardBalance
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Reward balance response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RewardBalanceResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /app/rewards/market:
    get:
      tags: [Rewards]
      summary: Get reward market catalog
      operationId: getRewardMarket
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: Reward market response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RewardMarketResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /app/viewer/stories/{storyId}:
    get:
      tags: [Viewer]
      summary: Get viewer story detail context
      operationId: getViewerStory
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/StoryId'
      responses:
        '200':
          description: Story viewer payload
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ViewerStoryResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    guestCheckout:
      type: apiKey
      in: header
      name: X-Guest-Session-Id

  parameters:
    Cursor:
      name: cursor
      in: query
      required: false
      schema:
        type: string

    Limit:
      name: limit
      in: query
      required: false
      schema:
        type: integer
        minimum: 1
        maximum: 50
        default: 20

    CartItemId:
      name: cartItemId
      in: path
      required: true
      schema:
        type: string

    CheckoutId:
      name: checkoutId
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

    AddressId:
      name: addressId
      in: path
      required: true
      schema:
        type: string

    NotificationId:
      name: notificationId
      in: path
      required: true
      schema:
        type: string

    StoryId:
      name: storyId
      in: path
      required: true
      schema:
        type: string

    ProductId:
      name: productId
      in: path
      required: true
      schema:
        type: string

  responses:
    BadRequest:
      description: Invalid request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'

    Unauthorized:
      description: Authentication required or invalid
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'

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
      description: Resource expired
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'

    DegradedUnavailable:
      description: Dependency degraded or temporarily unavailable
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'

  schemas:
    SessionContextResponse:
      type: object
      required: [actor_type, is_authenticated]
      properties:
        actor_type:
          type: string
          enum: [guest, user]
        is_authenticated:
          type: boolean
        user_id:
          type: string
          nullable: true
        guest_session_id:
          type: string
          nullable: true

    CartResponse:
      type: object
      required: [cart_id, items, totals]
      properties:
        cart_id:
          type: string
        actor_type:
          type: string
          enum: [guest, user]
        items:
          type: array
          items:
            $ref: '#/components/schemas/CartItem'
        totals:
          $ref: '#/components/schemas/CartTotals'
        currency:
          type: string
        warnings:
          type: array
          items:
            type: string

    CartItem:
      type: object
      required: [cart_item_id, product_id, quantity]
      properties:
        cart_item_id:
          type: string
        product_id:
          type: string
        variant_id:
          type: string
          nullable: true
        quantity:
          type: integer
        title:
          type: string
        price_preview:
          $ref: '#/components/schemas/Money'
        storefront_id:
          type: string
          nullable: true

    CartTotals:
      type: object
      required: [subtotal, final_total]
      properties:
        subtotal:
          $ref: '#/components/schemas/Money'
        shipping_total:
          $ref: '#/components/schemas/Money'
        discount_total:
          $ref: '#/components/schemas/Money'
        final_total:
          $ref: '#/components/schemas/Money'

    AddCartItemRequest:
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
          minimum: 1

    UpdateCartItemRequest:
      type: object
      properties:
        quantity:
          type: integer
          minimum: 1
        selected:
          type: boolean

    CheckoutReviewRequest:
      type: object
      required: [selected_cart_item_ids]
      properties:
        selected_cart_item_ids:
          type: array
          items:
            type: string
        address_id:
          type: string
          nullable: true
        guest_address:
          $ref: '#/components/schemas/AddressInput'
        coupon_code:
          type: string
          nullable: true

    CheckoutReviewResponse:
      type: object
      required: [checkout_id, checkout_state, reviewed_totals]
      properties:
        checkout_id:
          type: string
        checkout_state:
          type: string
          enum: [created, invalid, ready_for_payment, expired]
        reviewed_totals:
          $ref: '#/components/schemas/CartTotals'
        line_items:
          type: array
          items:
            $ref: '#/components/schemas/CheckoutLineItem'
        address_summary:
          $ref: '#/components/schemas/AddressSummary'
        coupon_result:
          $ref: '#/components/schemas/CouponResult'
        warnings:
          type: array
          items:
            type: string
        expires_at:
          type: string
          format: date-time
          nullable: true

    CheckoutDetailResponse:
      allOf:
        - $ref: '#/components/schemas/CheckoutReviewResponse'
        - type: object
          properties:
            stock_reservations:
              type: array
              items:
                $ref: '#/components/schemas/StockReservationView'
            price_lock:
              $ref: '#/components/schemas/PriceLockView'

    CheckoutLineItem:
      type: object
      required: [order_candidate_id, product_id, quantity, final_unit_price]
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
        final_unit_price:
          $ref: '#/components/schemas/Money'
        line_total:
          $ref: '#/components/schemas/Money'

    StockReservationView:
      type: object
      required: [product_id, reserved_quantity, reservation_state]
      properties:
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

    PriceLockView:
      type: object
      required: [lock_state]
      properties:
        lock_state:
          type: string
          enum: [active, consumed, released, expired]
        valid_until:
          type: string
          format: date-time
          nullable: true

    CreatePaymentIntentRequest:
      type: object
      required: [payment_method]
      properties:
        payment_method:
          type: string
        provider:
          type: string
          nullable: true
        return_url:
          type: string
          nullable: true

    CreatePaymentIntentResponse:
      type: object
      required: [payment_id, payment_state]
      properties:
        payment_id:
          type: string
        payment_state:
          type: string
          enum: [created, payment_in_progress, captured, failed, canceled]
        provider_payload:
          type: object
          additionalProperties: true
          nullable: true
        next_action:
          type: string
          nullable: true
        order_id:
          type: string
          nullable: true

    OrderListResponse:
      type: object
      required: [items, page_info]
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/OrderSummary'
        page_info:
          $ref: '#/components/schemas/PageInfo'

    OrderSummary:
      type: object
      required: [order_id, order_state, final_total, created_at]
      properties:
        order_id:
          type: string
        order_state:
          type: string
        final_total:
          $ref: '#/components/schemas/Money'
        created_at:
          type: string
          format: date-time
        storefronts:
          type: array
          items:
            $ref: '#/components/schemas/StorefrontMini'

    OrderDetailResponse:
      type: object
      required: [order_id, order_state, lines, pricing_snapshot]
      properties:
        order_id:
          type: string
        order_state:
          type: string
        created_at:
          type: string
          format: date-time
        lines:
          type: array
          items:
            $ref: '#/components/schemas/OrderLineView'
        pricing_snapshot:
          $ref: '#/components/schemas/OrderPricingSnapshotView'
        address_snapshot:
          $ref: '#/components/schemas/AddressSummary'
        storefront_snapshot:
          $ref: '#/components/schemas/StorefrontMini'
        shipments:
          type: array
          items:
            $ref: '#/components/schemas/ShipmentView'

    OrderLineView:
      type: object
      required: [order_line_id, product_id, quantity, line_state]
      properties:
        order_line_id:
          type: string
        product_id:
          type: string
        title:
          type: string
        quantity:
          type: integer
        line_state:
          type: string
        final_line_total:
          $ref: '#/components/schemas/Money'
        verified_purchase_state:
          type: string
          nullable: true
        review_eligibility_state:
          type: string
          nullable: true
        story_eligibility_state:
          type: string
          nullable: true

    ShipmentView:
      type: object
      required: [shipment_id, shipment_state]
      properties:
        shipment_id:
          type: string
        shipment_state:
          type: string
        tracking_no:
          type: string
          nullable: true
        delivered_at:
          type: string
          format: date-time
          nullable: true

    CreateCancelRequest:
      type: object
      required: [reason_code]
      properties:
        order_line_id:
          type: string
          nullable: true
        reason_code:
          type: string
        note:
          type: string
          nullable: true

    CancelRequestResponse:
      type: object
      required: [cancel_request_id, cancel_state]
      properties:
        cancel_request_id:
          type: string
        cancel_state:
          type: string

    CreateReturnRequest:
      type: object
      required: [items, reason_code]
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/ReturnItemInput'
        reason_code:
          type: string
        note:
          type: string
          nullable: true
        evidence_urls:
          type: array
          items:
            type: string

    ReturnItemInput:
      type: object
      required: [order_line_id, quantity]
      properties:
        order_line_id:
          type: string
        quantity:
          type: integer
          minimum: 1

    ReturnRequestResponse:
      type: object
      required: [return_request_id, return_state]
      properties:
        return_request_id:
          type: string
        return_state:
          type: string

    AccountDashboardResponse:
      type: object
      required: [profile, order_summary]
      properties:
        profile:
          $ref: '#/components/schemas/ProfileSummary'
        order_summary:
          type: object
          additionalProperties: true
        degraded_reason:
          type: string
          nullable: true

    ProfileSummary:
      type: object
      required: [user_id]
      properties:
        user_id:
          type: string
        display_name:
          type: string
          nullable: true
        email_masked:
          type: string
          nullable: true
        phone_masked:
          type: string
          nullable: true

    AddressListResponse:
      type: object
      required: [items]
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/AddressResponse'

    AddressResponse:
      type: object
      required: [address_id, country, city, district, address_lines]
      properties:
        address_id:
          type: string
        label:
          type: string
          nullable: true
        recipient_name:
          type: string
        phone:
          type: string
        country:
          type: string
        city:
          type: string
        district:
          type: string
        postal_code:
          type: string
          nullable: true
        address_lines:
          type: string
        is_default:
          type: boolean

    CreateAddressRequest:
      $ref: '#/components/schemas/AddressInput'

    UpdateAddressRequest:
      $ref: '#/components/schemas/AddressInput'

    AddressInput:
      type: object
      required: [recipient_name, phone, country, city, district, address_lines]
      properties:
        label:
          type: string
          nullable: true
        recipient_name:
          type: string
        phone:
          type: string
        country:
          type: string
        city:
          type: string
        district:
          type: string
        postal_code:
          type: string
          nullable: true
        address_lines:
          type: string
        is_default:
          type: boolean
          nullable: true

    AddressSummary:
      type: object
      properties:
        recipient_name:
          type: string
        city:
          type: string
        district:
          type: string
        address_lines:
          type: string

    NotificationListResponse:
      type: object
      required: [items, page_info]
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/NotificationItem'
        page_info:
          $ref: '#/components/schemas/PageInfo'

    NotificationItem:
      type: object
      required: [notification_id, type, title, is_read, created_at]
      properties:
        notification_id:
          type: string
        type:
          type: string
        title:
          type: string
        body:
          type: string
          nullable: true
        is_read:
          type: boolean
        deeplink:
          type: string
          nullable: true
        created_at:
          type: string
          format: date-time

    CreateLikeRequest:
      type: object
      required: [target_type, target_id]
      properties:
        target_type:
          type: string
          enum: [story, comment, post]
        target_id:
          type: string

    SetSaveRequest:
      type: object
      required: [target_type, target_id, is_saved]
      properties:
        target_type:
          type: string
          enum: [story, product, storefront]
        target_id:
          type: string
        is_saved:
          type: boolean

    SetFollowRequest:
      type: object
      required: [target_type, target_id, is_following]
      properties:
        target_type:
          type: string
          enum: [storefront, creator]
        target_id:
          type: string
        is_following:
          type: boolean

    InteractionStateResponse:
      type: object
      required: [target_type, target_id]
      properties:
        target_type:
          type: string
        target_id:
          type: string
        is_liked:
          type: boolean
          nullable: true
        is_saved:
          type: boolean
          nullable: true

    FollowStateResponse:
      type: object
      required: [target_type, target_id, is_following]
      properties:
        target_type:
          type: string
        target_id:
          type: string
        is_following:
          type: boolean

    CreateReviewRequest:
      type: object
      required: [order_id, order_line_id, rating, body]
      properties:
        order_id:
          type: string
        order_line_id:
          type: string
        rating:
          type: integer
          minimum: 1
          maximum: 5
        body:
          type: string
        media_urls:
          type: array
          items:
            type: string

    ReviewCommandResponse:
      type: object
      required: [review_id, review_state]
      properties:
        review_id:
          type: string
        review_state:
          type: string
          enum: [created, pending_moderation, published]

    CreateQuestionRequest:
      type: object
      required: [body]
      properties:
        body:
          type: string

    QuestionCommandResponse:
      type: object
      required: [question_id, question_state]
      properties:
        question_id:
          type: string
        question_state:
          type: string
          enum: [created, pending_moderation, published]

    CreateUserStoryRequest:
      type: object
      required: [order_id, order_line_id, product_id, media_urls]
      properties:
        order_id:
          type: string
        order_line_id:
          type: string
        product_id:
          type: string
        media_urls:
          type: array
          items:
            type: string
        caption:
          type: string
          nullable: true

    StoryCommandResponse:
      type: object
      required: [story_id, story_state]
      properties:
        story_id:
          type: string
        story_state:
          type: string
          enum: [created, pending_moderation, published]

    CreateSupportTicketRequest:
      type: object
      required: [subject_type, subject_id, title, body]
      properties:
        subject_type:
          type: string
          enum: [order, order_line, payment, shipment, return_request, review, story, general]
        subject_id:
          type: string
        title:
          type: string
        body:
          type: string
        attachments:
          type: array
          items:
            type: string

    SupportTicketResponse:
      type: object
      required: [ticket_id, state]
      properties:
        ticket_id:
          type: string
        state:
          type: string
          enum: [opened, queued, in_review, resolved, closed]

    SupportTicketListResponse:
      type: object
      required: [items, page_info]
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/SupportTicketItem'
        page_info:
          $ref: '#/components/schemas/PageInfo'

    SupportTicketItem:
      type: object
      required: [ticket_id, state, title, created_at]
      properties:
        ticket_id:
          type: string
        state:
          type: string
        title:
          type: string
        created_at:
          type: string
          format: date-time

    RewardBalanceResponse:
      type: object
      required: [available_points, pending_points]
      properties:
        available_points:
          type: integer
        pending_points:
          type: integer
        revoked_points:
          type: integer
          nullable: true

    RewardMarketResponse:
      type: object
      required: [items, page_info]
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/RewardMarketItem'
        page_info:
          $ref: '#/components/schemas/PageInfo'

    RewardMarketItem:
      type: object
      required: [reward_item_id, title, points_cost]
      properties:
        reward_item_id:
          type: string
        title:
          type: string
        points_cost:
          type: integer
        availability_state:
          type: string
          enum: [available, unavailable, limited]

    ViewerStoryResponse:
      type: object
      required: [story_id, media]
      properties:
        story_id:
          type: string
        media:
          type: array
          items:
            $ref: '#/components/schemas/MediaItem'
        related_products:
          type: array
          items:
            $ref: '#/components/schemas/ProductMini'
        storefront:
          $ref: '#/components/schemas/StorefrontMini'

    ProductMini:
      type: object
      required: [product_id, title]
      properties:
        product_id:
          type: string
        title:
          type: string
        price:
          $ref: '#/components/schemas/Money'

    StorefrontMini:
      type: object
      required: [storefront_id, display_name]
      properties:
        storefront_id:
          type: string
        display_name:
          type: string

    OrderPricingSnapshotView:
      type: object
      required: [final_total, currency]
      properties:
        subtotal:
          $ref: '#/components/schemas/Money'
        shipping_total:
          $ref: '#/components/schemas/Money'
        discount_total:
          $ref: '#/components/schemas/Money'
        final_total:
          $ref: '#/components/schemas/Money'
        currency:
          type: string

    CouponResult:
      type: object
      properties:
        coupon_code:
          type: string
          nullable: true
        status:
          type: string
          nullable: true
        discount_total:
          $ref: '#/components/schemas/Money'

    Money:
      type: object
      required: [amount, currency]
      properties:
        amount:
          type: number
          format: float
        currency:
          type: string

    MediaItem:
      type: object
      required: [url, type]
      properties:
        url:
          type: string
        type:
          type: string
          enum: [image, video]
        thumbnail_url:
          type: string
          nullable: true

    PageInfo:
      type: object
      required: [has_next_page]
      properties:
        next_cursor:
          type: string
          nullable: true
        has_next_page:
          type: boolean

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