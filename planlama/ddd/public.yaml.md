openapi: 3.1.0
info:
  title: HX Public API
  version: 0.1.0
  description: >
    Public-safe read-only API contract for anonymous and non-sensitive storefront surfaces.
    This spec excludes authenticated user-private data, panel operations, and internal service contracts.

servers:
  - url: https://api.hx.example.com

tags:
  - name: Health
  - name: Home
  - name: Discover
  - name: Category
  - name: Search
  - name: Products
  - name: Storefronts
  - name: Stories

paths:
  /public/health:
    get:
      tags: [Health]
      summary: Public health check
      operationId: getPublicHealth
      responses:
        '200':
          description: Service health summary
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PublicHealthResponse'

  /public/home:
    get:
      tags: [Home]
      summary: Get public home surface
      operationId: getPublicHome
      parameters:
        - $ref: '#/components/parameters/Locale'
        - $ref: '#/components/parameters/Currency'
        - $ref: '#/components/parameters/Region'
      responses:
        '200':
          description: Public home response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PublicHomeResponse'
        '503':
          $ref: '#/components/responses/DegradedUnavailable'

  /public/discover:
    get:
      tags: [Discover]
      summary: Get public discover feed
      operationId: getPublicDiscover
      parameters:
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
        - $ref: '#/components/parameters/Locale'
        - $ref: '#/components/parameters/Region'
      responses:
        '200':
          description: Public discover feed response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PublicDiscoverResponse'
        '503':
          $ref: '#/components/responses/DegradedUnavailable'

  /public/categories/{slug}:
    get:
      tags: [Category]
      summary: Get public category surface
      operationId: getPublicCategory
      parameters:
        - $ref: '#/components/parameters/CategorySlug'
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
        - $ref: '#/components/parameters/Sort'
        - $ref: '#/components/parameters/Locale'
        - $ref: '#/components/parameters/Region'
      responses:
        '200':
          description: Public category response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PublicCategoryResponse'
        '404':
          $ref: '#/components/responses/NotFound'
        '503':
          $ref: '#/components/responses/DegradedUnavailable'

  /public/search:
    get:
      tags: [Search]
      summary: Search public products and storefronts
      operationId: searchPublic
      parameters:
        - $ref: '#/components/parameters/Query'
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
        - $ref: '#/components/parameters/Locale'
        - $ref: '#/components/parameters/Region'
      responses:
        '200':
          description: Public search results
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PublicSearchResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '503':
          $ref: '#/components/responses/DegradedUnavailable'

  /public/products/{productId}:
    get:
      tags: [Products]
      summary: Get public product detail page
      operationId: getPublicProduct
      parameters:
        - $ref: '#/components/parameters/ProductId'
        - $ref: '#/components/parameters/Locale'
        - $ref: '#/components/parameters/Currency'
        - $ref: '#/components/parameters/Region'
      responses:
        '200':
          description: Public product detail response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PublicProductResponse'
        '404':
          $ref: '#/components/responses/NotFound'
        '503':
          $ref: '#/components/responses/DegradedUnavailable'

  /public/products/{productId}/stories:
    get:
      tags: [Stories]
      summary: Get public product story strip
      operationId: getPublicProductStories
      parameters:
        - $ref: '#/components/parameters/ProductId'
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: Public product stories
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PublicStoryListResponse'
        '404':
          $ref: '#/components/responses/NotFound'
        '503':
          $ref: '#/components/responses/DegradedUnavailable'

  /public/storefronts/{storefrontId}:
    get:
      tags: [Storefronts]
      summary: Get public storefront profile and catalog surface
      operationId: getPublicStorefront
      parameters:
        - $ref: '#/components/parameters/StorefrontId'
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
        - $ref: '#/components/parameters/Locale'
        - $ref: '#/components/parameters/Region'
      responses:
        '200':
          description: Public storefront response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PublicStorefrontResponse'
        '404':
          $ref: '#/components/responses/NotFound'
        '503':
          $ref: '#/components/responses/DegradedUnavailable'

components:
  parameters:
    Locale:
      name: locale
      in: query
      required: false
      schema:
        type: string
        example: tr-TR

    Currency:
      name: currency
      in: query
      required: false
      schema:
        type: string
        example: TRY

    Region:
      name: region
      in: query
      required: false
      schema:
        type: string
        example: TR

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

    Sort:
      name: sort
      in: query
      required: false
      schema:
        type: string
        enum: [relevance, newest, price_asc, price_desc, trending]

    Query:
      name: q
      in: query
      required: true
      schema:
        type: string
        minLength: 1
        maxLength: 200

    ProductId:
      name: productId
      in: path
      required: true
      schema:
        type: string

    CategorySlug:
      name: slug
      in: path
      required: true
      schema:
        type: string

    StorefrontId:
      name: storefrontId
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

    NotFound:
      description: Resource not found
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
    PublicHealthResponse:
      type: object
      required: [status, service_name, environment, timestamp]
      properties:
        status:
          type: string
          enum: [ok, degraded]
        service_name:
          type: string
        environment:
          type: string
        timestamp:
          type: string
          format: date-time
        version:
          type: string
        dependencies:
          type: array
          items:
            $ref: '#/components/schemas/DependencyStatus'

    DependencyStatus:
      type: object
      required: [name, kind, status]
      properties:
        name:
          type: string
        kind:
          type: string
        status:
          type: string
          enum: [ok, degraded, unknown, not_configured]
        reason:
          type: string
          nullable: true

    PublicHomeResponse:
      type: object
      required: [surface, blocks]
      properties:
        surface:
          type: string
          const: home
        blocks:
          type: array
          items:
            $ref: '#/components/schemas/HomeBlock'
        degraded_reason:
          type: string
          nullable: true
          description: Reason for partial response. Returns 503 if completely unavailable.
        source_mode:
          type: string
          nullable: true

    HomeBlock:
      type: object
      required: [block_id, block_type, title, items]
      properties:
        block_id:
          type: string
        block_type:
          type: string
          enum: [hero, grid, carousel, stories, products]
        title:
          type: string
        items:
          type: array
          items:
            $ref: '#/components/schemas/SurfaceItem'

    PublicDiscoverResponse:
      type: object
      required: [surface, items, page_info]
      properties:
        surface:
          type: string
          const: discover
        items:
          type: array
          items:
            $ref: '#/components/schemas/DiscoverItem'
        page_info:
          $ref: '#/components/schemas/PageInfo'
        degraded_reason:
          type: string
          nullable: true
          description: Reason for partial response. Returns 503 if completely unavailable.

    PublicCategoryResponse:
      type: object
      required: [surface, category, items, page_info]
      properties:
        surface:
          type: string
          const: category
        category:
          $ref: '#/components/schemas/CategorySummary'
        items:
          type: array
          items:
            $ref: '#/components/schemas/ProductCard'
        page_info:
          $ref: '#/components/schemas/PageInfo'
        filters:
          type: array
          items:
            $ref: '#/components/schemas/PublicFilter'
        sort:
          type: string
          nullable: true
        degraded_reason:
          type: string
          nullable: true
          description: Reason for partial response. Returns 503 if completely unavailable.

    PublicSearchResponse:
      type: object
      required: [surface, query, results, page_info]
      properties:
        surface:
          type: string
          const: search
        query:
          type: string
        results:
          type: array
          items:
            $ref: '#/components/schemas/SearchResult'
        page_info:
          $ref: '#/components/schemas/PageInfo'
        suggestions:
          type: array
          items:
            type: string
        degraded_reason:
          type: string
          nullable: true
          description: Reason for partial response. Returns 503 if completely unavailable.

    PublicProductResponse:
      type: object
      required: [surface, product, content_layer, social_layer]
      properties:
        surface:
          type: string
          const: product
        product:
          $ref: '#/components/schemas/ProductDetail'
        content_layer:
          $ref: '#/components/schemas/ProductContentLayer'
        social_layer:
          $ref: '#/components/schemas/ProductSocialLayer'
        degraded_reason:
          type: string
          nullable: true
          description: Reason for partial response. Returns 503 if completely unavailable.

    PublicStoryListResponse:
      type: object
      required: [items, page_info]
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/StoryCard'
        page_info:
          $ref: '#/components/schemas/PageInfo'

    PublicStorefrontResponse:
      type: object
      required: [surface, storefront, items, page_info]
      properties:
        surface:
          type: string
          const: storefront
        storefront:
          $ref: '#/components/schemas/StorefrontSummary'
        items:
          type: array
          items:
            $ref: '#/components/schemas/ProductCard'
        page_info:
          $ref: '#/components/schemas/PageInfo'
        degraded_reason:
          type: string
          nullable: true
          description: Reason for partial response. Returns 503 if completely unavailable.

    SurfaceItem:
      oneOf:
        - $ref: '#/components/schemas/ProductCard'
        - $ref: '#/components/schemas/StoryCard'
        - $ref: '#/components/schemas/StorefrontCard'

    DiscoverItem:
      type: object
      required: [content_id, content_type, media, product_refs]
      properties:
        content_id:
          type: string
        content_type:
          type: string
          enum: [video, story, post]
        media:
          type: array
          items:
            $ref: '#/components/schemas/MediaItem'
        product_refs:
          type: array
          items:
            $ref: '#/components/schemas/ProductRef'
        storefront:
          $ref: '#/components/schemas/StorefrontSummary'
        caption:
          type: string
          nullable: true

    ProductCard:
      type: object
      required: [result_type, product_id, title, price]
      properties:
        result_type:
          type: string
          const: product
        product_id:
          type: string
        title:
          type: string
        subtitle:
          type: string
          nullable: true
        price:
          $ref: '#/components/schemas/PriceView'
        media:
          type: array
          items:
            $ref: '#/components/schemas/MediaItem'
        storefront:
          $ref: '#/components/schemas/StorefrontSummary'
        badges:
          type: array
          items:
            type: string

    ProductDetail:
      type: object
      required: [product_id, title, media, pricing]
      properties:
        product_id:
          type: string
        title:
          type: string
        description:
          type: string
          nullable: true
        media:
          type: array
          items:
            $ref: '#/components/schemas/MediaItem'
        pricing:
          $ref: '#/components/schemas/PriceView'
        availability:
          $ref: '#/components/schemas/AvailabilityView'
        storefront:
          $ref: '#/components/schemas/StorefrontSummary'
        attributes:
          type: array
          items:
            $ref: '#/components/schemas/AttributeView'

    ProductContentLayer:
      type: object
      description: Read-only editorial and projection content layer for products.
      properties:
        editorial_content:
          type: array
          items:
            type: string
        product_story_strip:
          type: array
          items:
            $ref: '#/components/schemas/StoryCard'

    ProductSocialLayer:
      type: object
      description: Public social summary layer. Only contains public-safe aggregated metrics.
      properties:
        comment_count:
          type: integer
          description: Publicly visible aggregate comment count.
        average_rating:
          type: number
          format: float
          description: Publicly visible average rating.
        qa_count:
          type: integer
          description: Publicly visible answered Q&A count.
        public_highlights:
          type: array
          items:
            type: string
          description: Publicly visible semantic highlights from reviews.

    StorefrontSummary:
      type: object
      required: [storefront_id, display_name]
      properties:
        storefront_id:
          type: string
        display_name:
          type: string
        storefront_type:
          type: string
          nullable: true
        avatar_url:
          type: string
          nullable: true
        follower_count:
          type: integer
          nullable: true
          description: Public-safe aggregate follower count. Excludes private supplier details.

    StorefrontCard:
      type: object
      required: [result_type, storefront_id, display_name]
      properties:
        result_type:
          type: string
          const: storefront
        storefront_id:
          type: string
        display_name:
          type: string
        avatar_url:
          type: string
          nullable: true
        bio:
          type: string
          nullable: true

    StoryCard:
      type: object
      required: [story_id, media]
      properties:
        story_id:
          type: string
        media:
          type: array
          items:
            $ref: '#/components/schemas/MediaItem'
        storefront:
          $ref: '#/components/schemas/StorefrontSummary'
        title:
          type: string
          nullable: true

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

    ProductRef:
      type: object
      required: [product_id]
      properties:
        product_id:
          type: string
        title:
          type: string
          nullable: true

    PriceView:
      type: object
      required: [currency, final_amount]
      properties:
        currency:
          type: string
        list_amount:
          type: number
          format: float
          nullable: true
        final_amount:
          type: number
          format: float
        discount_label:
          type: string
          nullable: true

    AvailabilityView:
      type: object
      required: [status]
      properties:
        status:
          type: string
          enum: [available, low_stock, unavailable]
        stock_note:
          type: string
          nullable: true

    AttributeView:
      type: object
      required: [name, value]
      properties:
        name:
          type: string
        value:
          type: string

    CategorySummary:
      type: object
      required: [slug, title]
      properties:
        slug:
          type: string
        title:
          type: string
        description:
          type: string
          nullable: true

    PublicFilter:
      type: object
      required: [key, label, values]
      properties:
        key:
          type: string
        label:
          type: string
        values:
          type: array
          items:
            type: string

    SearchResult:
      oneOf:
        - $ref: '#/components/schemas/ProductCard'
        - $ref: '#/components/schemas/StorefrontCard'

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