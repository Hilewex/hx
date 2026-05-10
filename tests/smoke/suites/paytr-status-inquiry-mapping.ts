
import { deepStrictEqual, ok } from 'node:assert';
import {
  createPaytrStatusInquiryToken,
  mapPaytrStatusInquiryToReconciliationCandidate,
  normalizePaytrCurrency,
  parsePaytrAmountToMinorUnit,
  PaytrStatusInquiryErrorResponse,
  PaytrStatusInquirySuccessResponse,
} from '../../../packages/contracts/src/payment';
import { createProviderBoundaryFlags } from '../../../packages/contracts/src/provider';
import { SmokeRunner, SmokeResult } from '../types';

const runTest = (): { result: SmokeResult; message: string } => {
  try {
    // Test: createPaytrStatusInquiryToken should be deterministic
    const token = createPaytrStatusInquiryToken({
      merchantId: 'test-id',
      merchantOid: 'test-oid',
      merchantSalt: 'test-salt',
      merchantKey: 'test-key',
    });
    deepStrictEqual(token, '5KLYTpsGPLBd5jpHe814bhHePMTomBmQefLtQZJBMfg=', 'Token generation failed');

    // Test: should normalize PayTR currency correctly
    deepStrictEqual(normalizePaytrCurrency('TL'), 'TRY', 'Currency normalization for TL failed');
    deepStrictEqual(normalizePaytrCurrency('try'), 'TRY', 'Currency normalization for try failed');
    deepStrictEqual(normalizePaytrCurrency('USD'), 'USD', 'Currency normalization for USD failed');

    // Test: should parse various PayTR amount formats to minor unit
    deepStrictEqual(parsePaytrAmountToMinorUnit(10.8), 1080, 'Amount parsing for 10.8 failed');
    deepStrictEqual(parsePaytrAmountToMinorUnit('10.8'), 1080, 'Amount parsing for \'10.8\' failed');
    deepStrictEqual(parsePaytrAmountToMinorUnit('10,80'), 1080, 'Amount parsing for \'10,80\' failed');
    deepStrictEqual(parsePaytrAmountToMinorUnit(108), 10800, 'Amount parsing for 108 failed');

    // Test: should map a successful response to a succeeded_candidate
    const successResponse: PaytrStatusInquirySuccessResponse = {
      status: 'success',
      merchant_oid: 'test-oid-success',
      payment_amount: 100.5,
      payment_total: 100.5,
      currency: 'TRY',
      returns: {},
      test_mode: '1',
    };
    const successCandidate = mapPaytrStatusInquiryToReconciliationCandidate({
      merchantOid: 'test-oid-success',
      expectedAmountMinor: 10050,
      expectedCurrency: 'TRY',
      response: successResponse,
      occurredAt: new Date(),
      inquiryRef: 'ref-success',
    });
    deepStrictEqual(successCandidate.normalizedStatus, 'succeeded_candidate', 'Success case mapping failed');
    ok(successCandidate.shouldProcess, 'Success case should be processable');

    // Test: should map a response with amount mismatch to rejected_amount_mismatch
    const amountMismatchResponse: PaytrStatusInquirySuccessResponse = {
      status: 'success',
      merchant_oid: 'test-oid-amount-mismatch',
      payment_amount: 99.0,
      payment_total: 99.0,
      currency: 'TRY',
      returns: {},
      test_mode: '1',
    };
    const amountMismatchCandidate = mapPaytrStatusInquiryToReconciliationCandidate({
      merchantOid: 'test-oid-amount-mismatch',
      expectedAmountMinor: 10000,
      expectedCurrency: 'TRY',
      response: amountMismatchResponse,
      occurredAt: new Date(),
      inquiryRef: 'ref-amount-mismatch',
    });
    deepStrictEqual(amountMismatchCandidate.normalizedStatus, 'rejected_amount_mismatch', 'Amount mismatch case mapping failed');
    ok(amountMismatchCandidate.shouldReject, 'Amount mismatch case should be rejected');
    ok(amountMismatchCandidate.shouldReconcile, 'Amount mismatch case should be reconcilable');

    // Test: should map a response with currency mismatch to rejected_currency_mismatch
    const currencyMismatchResponse: PaytrStatusInquirySuccessResponse = {
        status: 'success',
        merchant_oid: 'test-oid-currency-mismatch',
        payment_amount: 100.5,
        payment_total: 100.5,
        currency: 'USD',
        returns: {},
        test_mode: '1',
    };
    const currencyMismatchCandidate = mapPaytrStatusInquiryToReconciliationCandidate({
        merchantOid: 'test-oid-currency-mismatch',
        expectedAmountMinor: 10050,
        expectedCurrency: 'TRY',
        response: currencyMismatchResponse,
        occurredAt: new Date(),
        inquiryRef: 'ref-currency-mismatch',
    });
    deepStrictEqual(currencyMismatchCandidate.normalizedStatus, 'rejected_currency_mismatch', 'Currency mismatch case mapping failed');
    ok(currencyMismatchCandidate.shouldReject, 'Currency mismatch case should be rejected');
    ok(currencyMismatchCandidate.shouldReconcile, 'Currency mismatch case should be reconcilable');

    // Test: should map a response with payment_amount/payment_total ambiguity to rejected_amount_mismatch
    const amountAmbiguityResponse: PaytrStatusInquirySuccessResponse = {
        status: 'success',
        merchant_oid: 'test-oid-amount-ambiguity',
        payment_amount: 100.5,
        payment_total: 100.6,
        currency: 'TRY',
        returns: {},
        test_mode: '1',
    };
    const amountAmbiguityCandidate = mapPaytrStatusInquiryToReconciliationCandidate({
        merchantOid: 'test-oid-amount-ambiguity',
        expectedAmountMinor: 10050,
        expectedCurrency: 'TRY',
        response: amountAmbiguityResponse,
        occurredAt: new Date(),
        inquiryRef: 'ref-amount-ambiguity',
    });
    deepStrictEqual(amountAmbiguityCandidate.normalizedStatus, 'rejected_amount_mismatch', 'Amount ambiguity case mapping failed');
    ok(amountAmbiguityCandidate.shouldReject, 'Amount ambiguity case should be rejected');
    ok(amountAmbiguityCandidate.shouldReconcile, 'Amount ambiguity case should be reconcilable');

    // Test: should map a response with invalid amount format to rejected_unexpected_format
    const invalidAmountResponse: PaytrStatusInquirySuccessResponse = {
        status: 'success',
        merchant_oid: 'test-oid-invalid-format',
        payment_amount: 'invalid',
        payment_total: 'invalid',
        currency: 'TRY',
        returns: {},
        test_mode: '1',
    };
    const invalidAmountCandidate = mapPaytrStatusInquiryToReconciliationCandidate({
        merchantOid: 'test-oid-invalid-format',
        expectedAmountMinor: 10050,
        expectedCurrency: 'TRY',
        response: invalidAmountResponse,
        occurredAt: new Date(),
        inquiryRef: 'ref-invalid-format',
    });
    deepStrictEqual(invalidAmountCandidate.normalizedStatus, 'rejected_unexpected_format', 'Invalid amount format case mapping failed');
    ok(invalidAmountCandidate.shouldReject, 'Invalid amount format case should be rejected');
    ok(invalidAmountCandidate.shouldReconcile, 'Invalid amount format case should be reconcilable');

    // Test: returns field does not change candidate status
    const returnsFieldResponse: PaytrStatusInquirySuccessResponse = {
        status: 'success',
        merchant_oid: 'test-oid-returns-field',
        payment_amount: 100.5,
        payment_total: 100.5,
        currency: 'TRY',
        returns: { some_data: 'is_present' },
        test_mode: '1',
    };
    const returnsFieldCandidate = mapPaytrStatusInquiryToReconciliationCandidate({
        merchantOid: 'test-oid-returns-field',
        expectedAmountMinor: 10050,
        expectedCurrency: 'TRY',
        response: returnsFieldResponse,
        occurredAt: new Date(),
        inquiryRef: 'ref-returns-field',
    });
    deepStrictEqual(returnsFieldCandidate.normalizedStatus, 'succeeded_candidate', 'Returns field case mapping failed');

    // Test: candidate.boundary is safe
    deepStrictEqual(successCandidate.boundary, createProviderBoundaryFlags(), 'Boundary flags should be default');

    // Test: should map inconclusive error to status_query_inconclusive
    const inconclusiveErrorResponse: PaytrStatusInquiryErrorResponse = {
      status: 'error',
      err_no: '003',
      err_msg: 'merchant_oid ile basarili odeme bulunamadi',
    };
    const inconclusiveCandidate = mapPaytrStatusInquiryToReconciliationCandidate({
      merchantOid: 'test-oid-inconclusive',
      expectedAmountMinor: 10000,
      expectedCurrency: 'TRY',
      response: inconclusiveErrorResponse,
      occurredAt: new Date(),
      inquiryRef: 'ref-inconclusive',
    });
    deepStrictEqual(inconclusiveCandidate.normalizedStatus, 'status_query_inconclusive', 'Inconclusive error case mapping failed');
    ok(!inconclusiveCandidate.shouldProcess, 'Inconclusive error case should not be processable');
    ok(inconclusiveCandidate.shouldReconcile, 'Inconclusive error case should be reconcilable');

    return { result: 'PASS', message: 'All PayTR status inquiry mapping tests passed.' };
  } catch (error) {
    return { result: 'FAIL', message: (error as Error).stack || (error as Error).message };
  }
};

export const paytrStatusInquiryMappingSmoke: SmokeRunner = {
  name: 'paytr-status-inquiry-mapping',
  run: async () => runTest(),
};
