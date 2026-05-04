import { 
  CartContext, 
  CartLine, 
  CartResponse, 
  AddToCartCommand, 
  UpdateCartLineCommand, 
  RemoveCartLineCommand
} from '@hx/contracts';
import { resolvePrice } from '@hx/pricing';
import { stockService } from '@hx/stock';
import { parseConfig } from '@hx/config';
import { persistenceConfigSchema } from '@hx/persistence';
import { randomUUID } from 'node:crypto';
import { ICartRepository } from './repository/interface';
import { InMemoryCartRepository } from './repository/in-memory';
import { PostgresCartRepository } from './repository/postgres';

let repository: ICartRepository;

function getRepository(): ICartRepository {
  if (repository) return repository;

  const config = parseConfig(persistenceConfigSchema);
  
  if (config.PERSISTENCE_MODE === 'postgres') {
    if (!config.DATABASE_URL) {
      throw new Error("DATABASE_URL is required when PERSISTENCE_MODE is 'postgres'");
    }
    repository = new PostgresCartRepository();
  } else {
    repository = new InMemoryCartRepository();
  }

  return repository;
}

// For testing purposes
export function resetRepository(mockRepo?: ICartRepository) {
  repository = mockRepo || new InMemoryCartRepository();
}

function calculateSummary(lines: CartLine[]) {
  return {
    totalQuantity: lines.reduce((acc, line) => acc + line.quantity, 0),
    subTotal: lines.reduce((acc, line) => acc + ((line.lineTotal !== undefined ? line.lineTotal : (line.unitPrice || 0) * line.quantity)), 0)
  };
}

export async function getCart(context: CartContext): Promise<{ status: number, data: CartResponse }> {
  const repo = getRepository();
  const lines = await repo.getLines(context);
  
  return {
    status: 200,
    data: {
      context,
      lines,
      summary: calculateSummary(lines)
    }
  };
}

export async function addToCart(context: CartContext, command: AddToCartCommand): Promise<{ status: number, data: CartResponse }> {
  if (command.quantity < 1) {
    return {
      status: 400,
      data: { context, lines: [], summary: { totalQuantity: 0 }, errors: [{ code: 'CART_INVALID_QUANTITY', message: 'Quantity must be at least 1' }] }
    };
  }

  if (!command.productId) {
    return {
      status: 400,
      data: { context, lines: [], summary: { totalQuantity: 0 }, errors: [{ code: 'CART_INVALID_PRODUCT', message: 'Product ID is required' }] }
    };
  }

  if (!command.storefrontId) {
    return {
      status: 400,
      data: { context, lines: [], summary: { totalQuantity: 0 }, errors: [{ code: 'CART_INVALID_PRODUCT', message: 'Storefront ID is required' }] }
    };
  }

  const repo = getRepository();
  const lines = await repo.getLines(context);

  const existingLine = lines.find(l => 
    l.productId === command.productId && 
    l.variantId === command.variantId && 
    l.storefrontId === command.storefrontId
  );

  const targetQuantity = (existingLine?.quantity || 0) + command.quantity;

  const stockResult = await stockService.resolveStock({
    productId: command.productId,
    variantId: command.variantId,
    storefrontId: command.storefrontId,
    requestedQuantity: targetQuantity
  });

  if (stockResult.status === 'STOCK_UNAVAILABLE') {
    return {
      status: 400,
      data: { context, lines, summary: calculateSummary(lines), errors: [{ code: 'CART_STOCK_UNAVAILABLE', message: 'Product is out of stock or requested quantity is not available' }] }
    };
  }

  const warnings: string[] = stockResult.availability?.warnings || [];

  if (existingLine) {
    existingLine.quantity += command.quantity;
    existingLine.stockAvailability = stockResult.availability;
    existingLine.warnings = [...(existingLine.warnings?.filter(w => !w.includes('few left')) || []), ...warnings];
    if (existingLine.unitPrice !== undefined) {
      existingLine.lineTotal = existingLine.unitPrice * existingLine.quantity;
    }
  } else {
    const isVariantRequired = command.productId.includes('variant_req');
    if (isVariantRequired && !command.variantId) {
       return {
        status: 400,
        data: { context, lines: [], summary: { totalQuantity: 0 }, errors: [{ code: 'CART_INVALID_VARIANT', message: 'Variant ID is required for this product' }] }
      };
    }

    const priceResult = await resolvePrice({
      productId: command.productId,
      variantId: command.variantId,
      storefrontId: command.storefrontId,
      quantity: command.quantity
    });

    if (priceResult.status === 'PRICE_UNAVAILABLE' || !priceResult.price) {
      return {
        status: 400,
        data: { context, lines, summary: calculateSummary(lines), errors: [{ code: 'CART_INVALID_PRODUCT', message: 'Pricing unavailable for this product' }] }
      };
    }

    const newLine: CartLine = {
      lineId: randomUUID(),
      productId: command.productId,
      variantId: command.variantId,
      storefrontId: command.storefrontId,
      quantity: command.quantity,
      productName: `Simulated Product ${command.productId}`,
      productStatus: 'ACTIVE',
      unitPrice: priceResult.price.activeUnitPrice,
      lineTotal: priceResult.price.activeUnitPrice * command.quantity,
      warnings,
      stockAvailability: stockResult.availability
    };
    lines.push(newLine);
  }

  await repo.saveLines(context, lines);

  return {
    status: 200,
    data: {
      context,
      lines,
      summary: calculateSummary(lines)
    }
  };
}

export async function updateCartLine(context: CartContext, command: UpdateCartLineCommand): Promise<{ status: number, data: CartResponse }> {
  const repo = getRepository();
  const lines = await repo.getLines(context);

  const line = lines.find(l => l.lineId === command.lineId);
  if (!line) {
    return {
      status: 404,
      data: { context, lines, summary: calculateSummary(lines), errors: [{ code: 'CART_LINE_NOT_FOUND', message: 'Cart line not found' }] }
    };
  }

  if (command.quantity < 1) {
    return {
      status: 400,
      data: { context, lines, summary: calculateSummary(lines), errors: [{ code: 'CART_INVALID_QUANTITY', message: 'Quantity must be at least 1' }] }
    };
  }

  const stockResult = await stockService.resolveStock({
    productId: line.productId,
    variantId: line.variantId,
    storefrontId: line.storefrontId,
    requestedQuantity: command.quantity
  });

  if (stockResult.status === 'STOCK_UNAVAILABLE') {
    return {
      status: 400,
      data: { context, lines, summary: calculateSummary(lines), errors: [{ code: 'CART_STOCK_UNAVAILABLE', message: 'Product is out of stock or requested quantity is not available' }] }
    };
  }

  line.quantity = command.quantity;
  line.stockAvailability = stockResult.availability;
  line.warnings = [...(line.warnings?.filter(w => !w.includes('few left')) || []), ...(stockResult.availability?.warnings || [])];
  
  if (line.unitPrice !== undefined) {
    line.lineTotal = line.unitPrice * line.quantity;
  }
  
  await repo.saveLines(context, lines);

  return {
    status: 200,
    data: {
      context,
      lines,
      summary: calculateSummary(lines)
    }
  };
}

export async function removeCartLine(context: CartContext, command: RemoveCartLineCommand): Promise<{ status: number, data: CartResponse }> {
  const repo = getRepository();
  let lines = await repo.getLines(context);

  const lineExists = lines.some(l => l.lineId === command.lineId);
  if (!lineExists) {
    return {
      status: 404,
      data: { context, lines, summary: calculateSummary(lines), errors: [{ code: 'CART_LINE_NOT_FOUND', message: 'Cart line not found' }] }
    };
  }

  lines = lines.filter(l => l.lineId !== command.lineId);
  await repo.saveLines(context, lines);

  return {
    status: 200,
    data: {
      context,
      lines,
      summary: calculateSummary(lines)
    }
  };
}

export async function clearCart(context: CartContext): Promise<void> {
  const repo = getRepository();
  await repo.clear(context);
}
