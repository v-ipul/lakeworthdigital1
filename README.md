  String detailsString = JSON.serialize(fetchExtractedText(ocrDocumentScanResultId, contentDocumentId)); 
        System.enqueueJob(new ProfitAndLossSaverJob(detailsString));
