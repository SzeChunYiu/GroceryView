export type ReportStatus = 'queued';

export type ReportPriceInput = {
  itemId: string;
  reportedPrice: number;
  storeName?: string;
  observedAt?: string;
  notes?: string;
};

export type QueuedPriceReport = {
  id: string;
  status: ReportStatus;
  createdAt: string;
  payload: ReportPriceInput;
};

const reportQueue: QueuedPriceReport[] = [];
let nextReportId = 1;

export function queuePriceReport(input: ReportPriceInput): QueuedPriceReport {
  const report: QueuedPriceReport = {
    id: `report-${nextReportId++}`,
    status: 'queued',
    createdAt: new Date().toISOString(),
    payload: input
  };
  reportQueue.push(report);
  return report;
}

export function getQueuedPriceReports(): readonly QueuedPriceReport[] {
  return reportQueue;
}

export function resetQueuedPriceReports(): void {
  reportQueue.length = 0;
  nextReportId = 1;
}
