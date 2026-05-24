export type OcrCorrectionStatus = 'corrections_pending' | 'corrected' | 'export_ready';

export type OcrScanHistoryItem = {
  id: string;
  merchantName: string;
  scannedAt: string;
  totalSek: number;
  correctionStatus: OcrCorrectionStatus;
  lineItemCount: number;
};

export const correctionStatusFilterChips: Array<{ status: OcrCorrectionStatus | 'all'; label: string; description: string }> = [
  {
    status: 'all',
    label: 'All scans',
    description: 'Show every premium OCR scan in the history timeline.',
  },
  {
    status: 'corrections_pending',
    label: 'Corrections pending',
    description: 'Receipts that still need shopper correction work before export.',
  },
  {
    status: 'corrected',
    label: 'Corrected',
    description: 'Receipts where OCR line items have been reviewed and corrected.',
  },
  {
    status: 'export_ready',
    label: 'Export ready',
    description: 'Corrected receipts that are ready for CSV or accounting export.',
  },
];

export const premiumOcrScanHistory: OcrScanHistoryItem[] = [
  {
    id: 'scan-2026-05-ica-001',
    merchantName: 'ICA Maxi Malmö',
    scannedAt: '2026-05-22T13:30:00.000Z',
    totalSek: 642.5,
    correctionStatus: 'corrections_pending',
    lineItemCount: 42,
  },
  {
    id: 'scan-2026-05-willys-014',
    merchantName: 'Willys Emporia',
    scannedAt: '2026-05-18T17:45:00.000Z',
    totalSek: 311.7,
    correctionStatus: 'corrected',
    lineItemCount: 26,
  },
  {
    id: 'scan-2026-05-coop-009',
    merchantName: 'Coop Triangeln',
    scannedAt: '2026-05-12T08:10:00.000Z',
    totalSek: 188.9,
    correctionStatus: 'export_ready',
    lineItemCount: 14,
  },
];

export function filterOcrScanHistoryByCorrectionStatus(scans: OcrScanHistoryItem[], status: OcrCorrectionStatus | 'all') {
  if (status === 'all') {
    return scans;
  }

  return scans.filter((scan) => scan.correctionStatus === status);
}

export function countOcrScanHistoryByCorrectionStatus(scans: OcrScanHistoryItem[]) {
  return correctionStatusFilterChips.reduce<Record<OcrCorrectionStatus | 'all', number>>((counts, chip) => {
    counts[chip.status] = chip.status === 'all' ? scans.length : scans.filter((scan) => scan.correctionStatus === chip.status).length;
    return counts;
  }, { all: 0, corrections_pending: 0, corrected: 0, export_ready: 0 });
}
