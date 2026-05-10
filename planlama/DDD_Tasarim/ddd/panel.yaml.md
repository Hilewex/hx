openapi: 3.1.0
info:
  title: HX Panel API
  version: 0.2.0
  description: >
    Panel API contract for creator panel, supplier panel, admin panel, moderation panel,
    operations/support panel, and finance panel.
    Panel APIs are protected action and projection surfaces. They are not direct truth-owner APIs.

servers:
  - url: https://api.hx.example.com

tags:
  - name: Panel Access
  - name: Creator Panel
  - name: Supplier Panel
  - name: Admin Panel
  - name: Moderation Panel
  - name: Operations Panel
  - name: Support Panel
  - name: Finance Panel
  - name: Audit

paths:
  /panel/access/context:
    get:
      tags: [Panel Access]
      summary: Get current panel access context
      operationId: getPanelAccessContext
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Panel access context
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PanelAccessContextResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

  /panel/creator/dashboard:
    get:
      tags: [Creator Panel]
      summary: Get creator panel dashboard
      operationId: getCreatorDashboard
      security:
        - bearerAuth: []
      x-required-scope: creator
      x-required-permissions: [creator_panel_view]
      responses:
        '200':
          description: Creator dashboard response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CreatorDashboardResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

  /panel/creator/store-products/reorder:
    post:
      tags: [Creator Panel]
      summary: Reorder products in creator storefront
      operationId: reorderCreatorStoreProducts
      security:
        - bearerAuth: []
      x-required-scope: creator
      x-required-permissions: [creator_store_manage]
      x-idempotency-required: true
      x-audit-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ReorderStoreProductsRequest'
      responses:
        '200':
          description: Store arrangement updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '403':
          $ref: '#/components/responses/Forbidden'
        '409':
          $ref: '#/components/responses/Conflict'

  /panel/creator/stories:
    post:
      tags: [Creator Panel]
      summary: Create creator storefront story
      operationId: createCreatorStory
      security:
        - bearerAuth: []
      x-required-scope: creator
      x-required-permissions: [creator_story_create]
      x-audit-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateCreatorStoryRequest'
      responses:
        '201':
          description: Story create command accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '403':
          $ref: '#/components/responses/Forbidden'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /panel/supplier/dashboard:
    get:
      tags: [Supplier Panel]
      summary: Get supplier panel dashboard
      operationId: getSupplierDashboard
      security:
        - bearerAuth: []
      x-required-scope: supplier
      x-required-permissions: [supplier_panel_view]
      responses:
        '200':
          description: Supplier dashboard response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SupplierDashboardResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

  /panel/supplier/products:
    post:
      tags: [Supplier Panel]
      summary: Submit supplier product input
      operationId: createSupplierProductInput
      security:
        - bearerAuth: []
      x-required-scope: supplier
      x-required-permissions: [supplier_product_input]
      x-idempotency-required: true
      x-audit-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateSupplierProductInputRequest'
      responses:
        '201':
          description: Product input accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '403':
          $ref: '#/components/responses/Forbidden'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /panel/supplier/inventory:
    post:
      tags: [Supplier Panel]
      summary: Submit stock update input
      operationId: updateSupplierInventory
      security:
        - bearerAuth: []
      x-required-scope: supplier
      x-required-permissions: [supplier_stock_input]
      x-idempotency-required: true
      x-audit-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateSupplierInventoryRequest'
      responses:
        '200':
          description: Inventory input accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '403':
          $ref: '#/components/responses/Forbidden'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /panel/supplier/base-prices:
    post:
      tags: [Supplier Panel]
      summary: Submit supplier base price input
      operationId: updateSupplierBasePrice
      security:
        - bearerAuth: []
      x-required-scope: supplier
      x-required-permissions: [supplier_base_price_input]
      x-idempotency-required: true
      x-audit-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateSupplierBasePriceRequest'
      responses:
        '200':
          description: Base price input accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '403':
          $ref: '#/components/responses/Forbidden'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /panel/supplier/fulfillment-actions:
    post:
      tags: [Supplier Panel]
      summary: Submit fulfillment action input
      operationId: createSupplierFulfillmentAction
      security:
        - bearerAuth: []
      x-required-scope: supplier
      x-required-permissions: [supplier_fulfillment_action]
      x-idempotency-required: true
      x-audit-required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateSupplierFulfillmentActionRequest'
      responses:
        '200':
          description: Fulfillment action accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '403':
          $ref: '#/components/responses/Forbidden'
        '409':
          $ref: '#/components/responses/Conflict'

  /panel/admin/dashboard:
    get:
      tags: [Admin Panel]
      summary: Get admin control tower dashboard
      operationId: getAdminDashboard
      security:
        - bearerAuth: []
      x-required-scope: admin
      x-required-permissions: [admin_dashboard_view]
      responses:
        '200':
          description: Admin dashboard response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AdminDashboardResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

  /panel/admin/creator-applications/{applicationId}/decision:
    post:
      tags: [Admin Panel]
      summary: Decide creator application
      operationId: decideCreatorApplication
      security:
        - bearerAuth: []
      x-required-scope: admin
      x-required-permissions: [creator_application_decide]
      x-idempotency-required: true
      x-audit-required: true
      x-reason-code-required: true
      parameters:
        - $ref: '#/components/parameters/ApplicationId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LifecycleDecisionRequest'
      responses:
        '200':
          description: Decision accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '403':
          $ref: '#/components/responses/Forbidden'
        '409':
          $ref: '#/components/responses/Conflict'

  /panel/admin/supplier-applications/{applicationId}/decision:
    post:
      tags: [Admin Panel]
      summary: Decide supplier application
      operationId: decideSupplierApplication
      security:
        - bearerAuth: []
      x-required-scope: admin
      x-required-permissions: [supplier_application_decide]
      x-idempotency-required: true
      x-audit-required: true
      x-reason-code-required: true
      parameters:
        - $ref: '#/components/parameters/ApplicationId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LifecycleDecisionRequest'
      responses:
        '200':
          description: Decision accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '403':
          $ref: '#/components/responses/Forbidden'
        '409':
          $ref: '#/components/responses/Conflict'

  /panel/admin/suppliers/{supplierId}/lifecycle-actions:
    post:
      tags: [Admin Panel]
      summary: Apply supplier lifecycle protected action
      operationId: applySupplierLifecycleAction
      security:
        - bearerAuth: []
      x-required-scope: admin
      x-required-permissions: [supplier_lifecycle_manage]
      x-idempotency-required: true
      x-audit-required: true
      x-reason-code-required: true
      parameters:
        - $ref: '#/components/parameters/SupplierId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LifecycleActionRequest'
      responses:
        '200':
          description: Lifecycle action accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '403':
          $ref: '#/components/responses/Forbidden'
        '409':
          $ref: '#/components/responses/Conflict'

  /panel/admin/products/{productId}/acceptance-actions:
    post:
      tags: [Admin Panel]
      summary: Apply product acceptance action
      operationId: applyProductAcceptanceAction
      security:
        - bearerAuth: []
      x-required-scope: admin
      x-required-permissions: [product_acceptance_manage]
      x-idempotency-required: true
      x-audit-required: true
      x-reason-code-required: true
      parameters:
        - $ref: '#/components/parameters/ProductId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProductAcceptanceActionRequest'
      responses:
        '200':
          description: Product acceptance action accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '403':
          $ref: '#/components/responses/Forbidden'
        '409':
          $ref: '#/components/responses/Conflict'

  /panel/moderation/queues/{queueType}:
    get:
      tags: [Moderation Panel]
      summary: List moderation queue
      operationId: listModerationQueue
      security:
        - bearerAuth: []
      x-required-scope: moderation
      x-required-permissions: [moderation_queue_view]
      parameters:
        - $ref: '#/components/parameters/QueueType'
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: Moderation queue response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ModerationQueueResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

  /panel/moderation/items/{moderationItemId}/actions:
    post:
      tags: [Moderation Panel]
      summary: Apply moderation action
      operationId: applyModerationAction
      security:
        - bearerAuth: []
      x-required-scope: moderation
      x-required-permissions: [moderation_action_apply]
      x-idempotency-required: true
      x-audit-required: true
      x-reason-code-required: true
      parameters:
        - $ref: '#/components/parameters/ModerationItemId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ModerationActionRequest'
      responses:
        '200':
          description: Moderation action accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '403':
          $ref: '#/components/responses/Forbidden'
        '409':
          $ref: '#/components/responses/Conflict'

  /panel/support/tickets:
    get:
      tags: [Support Panel]
      summary: List support tickets
      operationId: listSupportTickets
      security:
        - bearerAuth: []
      x-required-scope: support
      x-required-permissions: [ticket_view]
      parameters:
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: Ticket list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TicketListResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

  /panel/support/tickets/{ticketId}/assign:
    post:
      tags: [Support Panel]
      summary: Assign support ticket
      operationId: assignSupportTicket
      security:
        - bearerAuth: []
      x-required-scope: support
      x-required-permissions: [ticket_assign]
      x-idempotency-required: true
      x-audit-required: true
      parameters:
        - $ref: '#/components/parameters/TicketId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AssignTicketRequest'
      responses:
        '200':
          description: Ticket assign accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '403':
          $ref: '#/components/responses/Forbidden'
        '409':
          $ref: '#/components/responses/Conflict'

  /panel/support/tickets/{ticketId}/requeue:
    post:
      tags: [Support Panel]
      summary: Requeue support ticket
      operationId: requeueSupportTicket
      security:
        - bearerAuth: []
      x-required-scope: support
      x-required-permissions: [ticket_requeue]
      x-idempotency-required: true
      x-audit-required: true
      x-reason-code-required: true
      parameters:
        - $ref: '#/components/parameters/TicketId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RequeueTicketRequest'
      responses:
        '200':
          description: Ticket requeue accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '403':
          $ref: '#/components/responses/Forbidden'
        '409':
          $ref: '#/components/responses/Conflict'

  /panel/support/tickets/{ticketId}/escalate:
    post:
      tags: [Support Panel]
      summary: Escalate support ticket
      operationId: escalateSupportTicket
      security:
        - bearerAuth: []
      x-required-scope: support
      x-required-permissions: [ticket_escalate]
      x-idempotency-required: true
      x-audit-required: true
      x-reason-code-required: true
      parameters:
        - $ref: '#/components/parameters/TicketId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EscalateTicketRequest'
      responses:
        '200':
          description: Ticket escalate accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '403':
          $ref: '#/components/responses/Forbidden'
        '409':
          $ref: '#/components/responses/Conflict'

  /panel/support/tickets/{ticketId}/resolve:
    post:
      tags: [Support Panel]
      summary: Resolve support ticket
      operationId: resolveSupportTicket
      security:
        - bearerAuth: []
      x-required-scope: support
      x-required-permissions: [ticket_resolve]
      x-idempotency-required: true
      x-audit-required: true
      x-reason-code-required: true
      parameters:
        - $ref: '#/components/parameters/TicketId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ResolveTicketRequest'
      responses:
        '200':
          description: Ticket resolve accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '403':
          $ref: '#/components/responses/Forbidden'
        '409':
          $ref: '#/components/responses/Conflict'

  /panel/support/tickets/{ticketId}/close:
    post:
      tags: [Support Panel]
      summary: Close support ticket
      operationId: closeSupportTicket
      security:
        - bearerAuth: []
      x-required-scope: support
      x-required-permissions: [ticket_close]
      x-idempotency-required: true
      x-audit-required: true
      x-reason-code-required: true
      parameters:
        - $ref: '#/components/parameters/TicketId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CloseTicketRequest'
      responses:
        '200':
          description: Ticket close accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '403':
          $ref: '#/components/responses/Forbidden'
        '409':
          $ref: '#/components/responses/Conflict'

  /panel/operations/orders/{orderId}/interventions:
    post:
      tags: [Operations Panel]
      summary: Apply order intervention
      operationId: applyOrderIntervention
      security:
        - bearerAuth: []
      x-required-scope: operations
      x-required-permissions: [order_intervene]
      x-idempotency-required: true
      x-audit-required: true
      x-reason-code-required: true
      parameters:
        - $ref: '#/components/parameters/OrderId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/OrderInterventionRequest'
      responses:
        '200':
          description: Order intervention accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '403':
          $ref: '#/components/responses/Forbidden'
        '409':
          $ref: '#/components/responses/Conflict'

  /panel/operations/return-requests/{returnRequestId}/decision:
    post:
      tags: [Operations Panel]
      summary: Decide return request operationally
      operationId: decideReturnRequest
      security:
        - bearerAuth: []
      x-required-scope: operations
      x-required-permissions: [return_manage]
      x-idempotency-required: true
      x-audit-required: true
      x-reason-code-required: true
      parameters:
        - $ref: '#/components/parameters/ReturnRequestId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ReturnDecisionRequest'
      responses:
        '200':
          description: Return decision accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '403':
          $ref: '#/components/responses/Forbidden'
        '409':
          $ref: '#/components/responses/Conflict'

  /panel/finance/refunds/{refundRecordId}/execute:
    post:
      tags: [Finance Panel]
      summary: Execute refund
      operationId: executeRefund
      security:
        - bearerAuth: []
      x-required-scope: finance
      x-required-permissions: [refund_execute]
      x-idempotency-required: true
      x-audit-required: true
      x-reason-code-required: true
      parameters:
        - $ref: '#/components/parameters/RefundRecordId'
      requestBody:
        required: false
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/FinanceActionNoteRequest'
      responses:
        '200':
          description: Refund execution accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '403':
          $ref: '#/components/responses/Forbidden'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /panel/finance/settlement-lines:
    get:
      tags: [Finance Panel]
      summary: List settlement lines for finance review
      operationId: listSettlementLines
      security:
        - bearerAuth: []
      x-required-scope: finance
      x-required-permissions: [settlement_view]
      parameters:
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: Settlement line list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SettlementLineListResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

  /panel/finance/settlement-lines/{settlementLineId}/adjustments:
    post:
      tags: [Finance Panel]
      summary: Create finance settlement adjustment
      operationId: createFinanceSettlementAdjustment
      security:
        - bearerAuth: []
      x-required-scope: finance
      x-required-permissions: [settlement_adjust]
      x-idempotency-required: true
      x-audit-required: true
      x-reason-code-required: true
      parameters:
        - $ref: '#/components/parameters/SettlementLineId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateSettlementAdjustmentPanelRequest'
      responses:
        '201':
          description: Settlement adjustment accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '403':
          $ref: '#/components/responses/Forbidden'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /panel/finance/payout-batches:
    get:
      tags: [Finance Panel]
      summary: List payout batches
      operationId: listPayoutBatches
      security:
        - bearerAuth: []
      x-required-scope: finance
      x-required-permissions: [payout_view]
      parameters:
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: Payout batch list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PayoutBatchListResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

  /panel/finance/payout-batches/{payoutBatchId}/actions:
    post:
      tags: [Finance Panel]
      summary: Apply payout batch action
      operationId: applyPayoutBatchAction
      security:
        - bearerAuth: []
      x-required-scope: finance
      x-required-permissions: [payout_manage]
      x-idempotency-required: true
      x-audit-required: true
      x-reason-code-required: true
      parameters:
        - $ref: '#/components/parameters/PayoutBatchId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PayoutBatchActionRequest'
      responses:
        '200':
          description: Payout action accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommandAcceptedResponse'
        '403':
          $ref: '#/components/responses/Forbidden'
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /panel/audit/logs:
    get:
      tags: [Audit]
      summary: Query audit logs
      operationId: listAuditLogs
      security:
        - bearerAuth: []
      x-required-scope: admin
      x-required-permissions: [audit_log_view]
      parameters:
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
        - name: actor_id
          in: query
          required: false
          schema:
            type: string
        - name: target_type
          in: query
          required: false
          schema:
            type: string
        - name: target_id
          in: query
          required: false
          schema:
            type: string
      responses:
        '200':
          description: Audit log query response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuditLogListResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

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
        maximum: 100
        default: 20
    ApplicationId:
      name: applicationId
      in: path
      required: true
      schema:
        type: string
    SupplierId:
      name: supplierId
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
    ModerationItemId:
      name: moderationItemId
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
    ReturnRequestId:
      name: returnRequestId
      in: path
      required: true
      schema:
        type: string
    RefundRecordId:
      name: refundRecordId
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
    TicketId:
      name: ticketId
      in: path
      required: true
      schema:
        type: string
    QueueType:
      name: queueType
      in: path
      required: true
      schema:
        type: string
        enum: [comments, stories, qa, posts, storefront_content, reported_content, repeat_offenders]

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
    Forbidden:
      description: Scope or permission denied
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    Conflict:
      description: State conflict or concurrent action conflict
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

  schemas:
    PanelAccessContextResponse:
      type: object
      required: [actor_id, scopes, permissions]
      properties:
        actor_id:
          type: string
        scopes:
          type: array
          items:
            type: string
        permissions:
          type: array
          items:
            type: string
        active_panel_modes:
          type: array
          items:
            type: string

    CommandAcceptedResponse:
      type: object
      required: [status, command_id]
      properties:
        status:
          type: string
          enum: [accepted]
        command_id:
          type: string
        target_id:
          type: string
          nullable: true
        target_type:
          type: string
          nullable: true

    CreatorDashboardResponse:
      type: object
      required: [storefront, metrics]
      properties:
        storefront:
          $ref: '#/components/schemas/StorefrontPanelSummary'
        metrics:
          type: object
          additionalProperties: true
        alerts:
          type: array
          items:
            type: string

    SupplierDashboardResponse:
      type: object
      required: [supplier_lifecycle, metrics]
      properties:
        supplier_lifecycle:
          $ref: '#/components/schemas/SupplierLifecycleView'
        metrics:
          type: object
          additionalProperties: true
        alerts:
          type: array
          items:
            type: string

    AdminDashboardResponse:
      type: object
      required: [control_tower]
      properties:
        control_tower:
          type: object
          additionalProperties: true
        alerts:
          type: array
          items:
            type: string

    ReorderStoreProductsRequest:
      type: object
      required: [product_ids]
      properties:
        product_ids:
          type: array
          items:
            type: string

    CreateCreatorStoryRequest:
      type: object
      required: [media_refs]
      properties:
        media_refs:
          type: array
          items:
            type: string
        title:
          type: string
          nullable: true
        note:
          type: string
          nullable: true

    CreateSupplierProductInputRequest:
      type: object
      required: [product_title, category_id]
      properties:
        product_title:
          type: string
        category_id:
          type: string
        variant_inputs:
          type: array
          items:
            type: object
            additionalProperties: true
        media_refs:
          type: array
          items:
            type: string

    UpdateSupplierInventoryRequest:
      type: object
      required: [items]
      properties:
        items:
          type: array
          items:
            type: object
            required: [sku, quantity]
            properties:
              sku:
                type: string
              quantity:
                type: integer

    UpdateSupplierBasePriceRequest:
      type: object
      required: [items]
      properties:
        items:
          type: array
          items:
            type: object
            required: [sku, base_price]
            properties:
              sku:
                type: string
              base_price:
                $ref: '#/components/schemas/Money'

    CreateSupplierFulfillmentActionRequest:
      type: object
      required: [action_type, order_id]
      properties:
        action_type:
          type: string
          enum: [prepare, ship, add_tracking]
        order_id:
          type: string
        shipment_id:
          type: string
          nullable: true
        tracking_no:
          type: string
          nullable: true
        note:
          type: string
          nullable: true

    LifecycleDecisionRequest:
      type: object
      required: [decision, reason_code]
      properties:
        decision:
          type: string
          enum: [approve, reject, revision_request]
        reason_code:
          type: string
        note:
          type: string
          nullable: true

    LifecycleActionRequest:
      type: object
      required: [action, reason_code]
      properties:
        action:
          type: string
          enum: [activate, restrict, suspend, close, release]
        reason_code:
          type: string
        note:
          type: string
          nullable: true

    ProductAcceptanceActionRequest:
      type: object
      required: [action, reason_code]
      properties:
        action:
          type: string
          enum: [accept, reject, request_revision, restrict]
        reason_code:
          type: string
        note:
          type: string
          nullable: true

    ModerationActionRequest:
      type: object
      required: [action, reason_code]
      properties:
        action:
          type: string
          enum: [approve, reject, restrict, takedown, escalate, restore]
        reason_code:
          type: string
        note:
          type: string
          nullable: true

    OrderInterventionRequest:
      type: object
      required: [action, reason_code]
      properties:
        action:
          type: string
          enum: [cancel, escalate, flag_issue]
        reason_code:
          type: string
        note:
          type: string
          nullable: true

    ReturnDecisionRequest:
      type: object
      required: [decision, reason_code]
      properties:
        decision:
          type: string
          enum: [approve, reject, escalate]
        reason_code:
          type: string
        note:
          type: string
          nullable: true

    FinanceActionNoteRequest:
      type: object
      properties:
        reason_code:
          type: string
        note:
          type: string
          nullable: true

    PayoutBatchActionRequest:
      type: object
      required: [action, reason_code]
      properties:
        action:
          type: string
          enum: [approve, hold, release]
        reason_code:
          type: string
        note:
          type: string
          nullable: true

    AssignTicketRequest:
      type: object
      required: [assignee_actor_id]
      properties:
        assignee_actor_id:
          type: string

    RequeueTicketRequest:
      type: object
      required: [reason_code]
      properties:
        reason_code:
          type: string
        queue_target:
          type: string
          nullable: true
        note:
          type: string
          nullable: true

    EscalateTicketRequest:
      type: object
      required: [reason_code]
      properties:
        reason_code:
          type: string
        escalation_target:
          type: string
          nullable: true
        note:
          type: string
          nullable: true

    ResolveTicketRequest:
      type: object
      required: [reason_code]
      properties:
        reason_code:
          type: string
        resolution_note:
          type: string
          nullable: true

    CloseTicketRequest:
      type: object
      required: [reason_code]
      properties:
        reason_code:
          type: string
        close_note:
          type: string
          nullable: true

    CreateSettlementAdjustmentPanelRequest:
      type: object
      required: [adjustment_amount, trigger_type, reason_code]
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
        note:
          type: string
          nullable: true

    ModerationQueueResponse:
      type: object
      required: [queue_type, items, page_info]
      properties:
        queue_type:
          type: string
        items:
          type: array
          items:
            $ref: '#/components/schemas/ModerationQueueItem'
        page_info:
          $ref: '#/components/schemas/PageInfo'

    ModerationQueueItem:
      type: object
      required: [moderation_item_id, subject_type, state]
      properties:
        moderation_item_id:
          type: string
        subject_type:
          type: string
        subject_id:
          type: string
        state:
          type: string
        summary:
          type: string
          nullable: true

    TicketListResponse:
      type: object
      required: [items, page_info]
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/TicketSummary'
        page_info:
          $ref: '#/components/schemas/PageInfo'

    TicketSummary:
      type: object
      required: [ticket_id, state, title]
      properties:
        ticket_id:
          type: string
        state:
          type: string
        title:
          type: string
        sla_risk:
          type: boolean
          nullable: true
        assignee_actor_id:
          type: string
          nullable: true

    SettlementLineListResponse:
      type: object
      required: [items, page_info]
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/SettlementLineItem'
        page_info:
          $ref: '#/components/schemas/PageInfo'

    SettlementLineItem:
      type: object
      required: [settlement_line_id, settlement_state, order_line_id]
      properties:
        settlement_line_id:
          type: string
        settlement_state:
          type: string
        order_line_id:
          type: string
        recipient_type:
          type: string
          nullable: true
        payable_amount:
          $ref: '#/components/schemas/Money'

    PayoutBatchListResponse:
      type: object
      required: [items, page_info]
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/PayoutBatchItemView'
        page_info:
          $ref: '#/components/schemas/PageInfo'

    PayoutBatchItemView:
      type: object
      required: [payout_batch_id, payout_state]
      properties:
        payout_batch_id:
          type: string
        payout_state:
          type: string
        recipient_type:
          type: string
          nullable: true
        recipient_id:
          type: string
          nullable: true
        total_payable_amount:
          $ref: '#/components/schemas/Money'

    AuditLogListResponse:
      type: object
      required: [items, page_info]
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/AuditLogItem'
        page_info:
          $ref: '#/components/schemas/PageInfo'

    AuditLogItem:
      type: object
      required: [audit_id, actor_id, action, target_type, target_id, created_at]
      properties:
        audit_id:
          type: string
        actor_id:
          type: string
        action:
          type: string
        target_type:
          type: string
        target_id:
          type: string
        previous_state:
          type: string
          nullable: true
        next_state:
          type: string
          nullable: true
        reason_code:
          type: string
          nullable: true
        command_id:
          type: string
          nullable: true
        created_at:
          type: string
          format: date-time

    SupplierLifecycleView:
      type: object
      required: [supplier_id, lifecycle_state]
      properties:
        supplier_id:
          type: string
        lifecycle_state:
          type: string
        category_permissions:
          type: array
          items:
            type: string
        upload_permission_state:
          type: string
          nullable: true

    StorefrontPanelSummary:
      type: object
      required: [storefront_id, display_name]
      properties:
        storefront_id:
          type: string
        display_name:
          type: string
        lifecycle_state:
          type: string
          nullable: true

    Money:
      type: object
      required: [amount, currency]
      properties:
        amount:
          type: number
          format: float
        currency:
          type: string

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