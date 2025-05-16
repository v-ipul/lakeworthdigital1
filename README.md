# lakeworthdigital1

String detailsString = fetchExtractedText(ocrDocumentScanResultId, contentDocumentId);
System.enqueueJob(new ProfitAndLossSaverJob(detailsString));
